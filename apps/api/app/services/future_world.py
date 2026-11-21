"""Owner-bound town conversations. Savings scenarios use integer satang and zero growth."""
import asyncio
from weakref import WeakValueDictionary
from decimal import Decimal, ROUND_HALF_UP

from pymongo.errors import PyMongoError

from app.ai.companion_model import CompanionModel
from app.ai.future_world import ProviderUnavailable, choose_topic, design_landmark, narrate
from app.data.goal_plans import list_plans, resolve_appearance
from app.schemas.future_world import (
    Comparison, GoalCard, GoalCards, Point, Progress, SavingsPath, WorldReply,
)


class TurnConflict(Exception):
    pass


def satang(value):
    return int((Decimal(str(value)) * 100).to_integral_value(rounding=ROUND_HALF_UP))


def months_to_target(remaining, monthly):
    if remaining == 0:
        return 0
    return (remaining + monthly - 1) // monthly if monthly else None


def timeline(months):
    if months is None:
        return "no target date without contributions"
    if months == 0:
        return "already funded"
    return f"{months:,} month{'s' if months != 1 else ''}"


def thb(amount):
    return f"THB {amount:,.2f}".removesuffix(".00")


def goal_visual(plan, proposed_monthly):
    saved, target, monthly = (satang(value) for value in (plan.saved, plan.target, plan.monthly))
    remaining = max(0, target - saved)
    current_months = months_to_target(remaining, monthly)
    if proposed_monthly is None:
        visual = Progress(title=plan.title, saved=plan.saved, target=plan.target, monthly=plan.monthly,
                          remaining=remaining / 100, months_to_target=current_months)
        caption = f"{thb(plan.saved)} of {thb(plan.target)} saved. {thb(visual.remaining)} to go."
        if remaining and current_months is not None:
            caption += f" Estimated time at {thb(plan.monthly)}/month with zero growth: {timeline(current_months)}."
        return visual, caption

    proposed_months = months_to_target(remaining, proposed_monthly)
    end = max(1, current_months or 0, proposed_months or 0)
    milestones = {0, end, current_months or 0, proposed_months or 0}
    for rate, months in ((monthly, current_months), (proposed_monthly, proposed_months)):
        if months and remaining % rate:
            milestones.add(months - 1)
    ticks = sorted(milestones)

    def path(label, rate, months):
        return SavingsPath(label=label, monthly=rate / 100, months_to_target=months,
            points=[Point(month=m, balance=min(target, saved + m * rate) / 100) for m in ticks])

    visual = Comparison(title=plan.title, target=plan.target,
        current=path("Current plan", monthly, current_months),
        proposed=path("Preview", proposed_monthly, proposed_months))
    caption = (f"{thb(visual.current.monthly)}/month: {timeline(current_months)}. "
               f"{thb(visual.proposed.monthly)}/month: {timeline(proposed_months)}.")
    return visual, caption


def replay(history, turn):
    if turn.turn < len(history) and history[turn.turn]["request"] == turn.model_dump(mode="json"):
        return WorldReply.model_validate(history[turn.turn]["reply"])
    raise TurnConflict


class WorldGuide:
    def __init__(self, goals, conversations, owner, model):
        self.goals = goals
        self.store = conversations
        self.owner = owner
        self.model = model

    async def respond(self, turn):
        history = await self.store.read(turn.conversation_id)
        if turn.turn != len(history):
            return replay(history, turn)
        model = CompanionModel() if turn.offline else self.model
        plans = {g.id: g for g in await list_plans(self.goals, self.owner) if g.id != "emergency"}
        if turn.goal_id is not None and turn.goal_id not in plans:
            raise KeyError(turn.goal_id)
        selected = turn.goal_id or (history[-1]["reply"]["goal_id"] if history else None)
        recent = [{"question": item["request"]["question"], "answer": item["reply"]["answer"]}
                  for item in history[-6:]]
        proposed = None
        if turn.extra_monthly is not None and selected in plans:
            proposed = satang(plans[selected].monthly) + satang(turn.extra_monthly)
        elif turn.question:
            topic = await choose_topic(model, turn.question, selected, plans, recent)
            selected = topic.goal_id if topic.goal_id in plans else None
            if selected and topic.contribution != "none" and topic.amount is not None:
                proposed = satang(topic.amount)
                if topic.contribution == "extra":
                    proposed += satang(plans[selected].monthly)
        if selected in plans:
            visual, caption = goal_visual(plans[selected], proposed)
        else:
            selected = None
            visual = GoalCards(goals=[GoalCard(id=g.id, title=g.title) for g in plans.values()])
            caption = "Choose a saved goal to see its progress." if plans else "Add a goal to create your first landmark."
        answer = await narrate(model, turn.question, visual, caption, recent)
        reply = WorldReply(mode="openai" if model.client else "offline", goal_id=selected,
                           answer=answer, caption=caption, visual=visual)
        if await self.store.append(turn, reply):
            return reply
        return replay(await self.store.read(turn.conversation_id), turn)

class WorldLandmarks:
    def __init__(self):
        self.locks = WeakValueDictionary()

    async def get(self, collection, owner, slug, model):
        # Saving a new goal and entering town often overlap. Share the generation work.
        lock = self.locks.setdefault((owner, slug), asyncio.Lock())
        async with lock:
            return await resolve_appearance(collection, owner, slug, lambda title: design_landmark(model, title))

    async def prepare(self, collection, owner, slug, model):
        try:
            await self.get(collection, owner, slug, model)
        except (KeyError, ValueError, ProviderUnavailable, PyMongoError):
            # The financial save has succeeded. The town displays its default and can retry.
            return
