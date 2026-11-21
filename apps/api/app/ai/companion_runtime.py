import asyncio
import re
from dataclasses import dataclass, field

from app.ai.companion_tools import call_tool
from app.schemas.companion import Reply


@dataclass
class Part:
    text: str = ""
    evidence: list[str] = field(default_factory=list)
    status: str = "complete"
    agent: str | None = None


def money(value):
    return f"{float(value):,.2f}".removesuffix(".00")


class TurnRunner:
    def __init__(self, services, turn):
        self.s = services
        self.turn = turn
        self.calls = 0
        self.thai = bool(re.search("[ก-๙]", turn.question))

    def say(self, en, th):
        return th if self.thai else en

    async def tool(self, agent, name, args, parent):
        if self.calls >= 6:
            raise RuntimeError("Turn tool budget exhausted")
        self.calls += 1
        return await call_tool(agent, name, args, self.s, parent)

    async def goal(self, parent, goal_id, amount):
        if amount is None:
            plan = await self.tool("goal_planner", "assess_my_goal", {"goal_id": goal_id}, parent)
            prefix = ""
        else:
            comparison = await self.tool("goal_planner", "preview_my_contribution",
                                         {"goal_id": goal_id, "monthly_thb": amount}, parent)
            plan = comparison["preview"]
            prefix = self.say(f"Preview at THB {money(amount)} per month. ", f"หากออมเดือนละ {money(amount)} บาท ")
        gap, needed = money(plan["gap_thb"]), money(plan["required_monthly_thb"])
        months, rate = plan["months"], plan["annual_rate"] * 100
        projected = money(plan["projected_thb"])
        return Part(prefix + self.say(
            f"For {plan['goal']}, estimated savings after {months} months are THB {projected}. "
            f"Estimated shortfall: THB {gap}. The target requires THB {needed}/month at {rate:g}% annually.",
            f"เป้าหมาย {plan['goal']} คาดว่าจะมีเงิน {projected} บาทใน {months} เดือน "
            f"ขาดอีก {gap} บาท ยอดออมที่คาดว่าจะถึงเป้าคือ {needed} บาทต่อเดือน "
            f"ภายใต้สมมติฐานผลตอบแทน {rate:g}% ต่อปี"), ["Demo goal · monthly compounding · end-of-month deposits"])

    async def portfolio(self, parent):
        item = await self.tool("portfolio_analyst", "read_my_portfolio", {}, parent)
        total = money(item["total_value_thb"])
        cash = money(item["cash_thb"]) if item.get("cash_thb") is not None else self.say("unavailable", "ไม่มีข้อมูล")
        weights = ", ".join(f"{h['symbol']} {h['weight_pct']}%" for h in item["holdings"])
        return Part(self.say(f"Portfolio value: THB {total}. Cash (THB): {cash}.",
                             f"มูลค่าพอร์ต {total} บาท เงินสด (บาท) {cash}") + (" " + weights if weights else ""),
                    ["Demo portfolio · " + item["as_of"]])

    async def sentiment(self, parent, intent):
        pieces, evidence = [], []
        failed = False
        if intent.reflection:
            try:
                cue = (await self.tool("sentiment_analyst", "reflect_current_turn", {}, parent))["cue"]
                acknowledgments = {
                    "concern": self.say("I hear your concern.", "เข้าใจว่าคุณกังวลนะ"),
                    "enthusiasm": self.say("I hear your excitement.", "ฟังดูคุณตื่นเต้นนะ"),
                    "mixed": self.say("You mentioned mixed feelings.", "คุณเล่าว่ามีทั้งความกังวลและความตื่นเต้น")}
                if cue in acknowledgments:
                    pieces.append(acknowledgments[cue])
            except Exception:
                failed = True
        if intent.news and not intent.symbol:
            pieces.append(self.say("Which stock should I check?", "อยากดูข่าวของหุ้นตัวไหนครับ"))
            return Part(" ".join(pieces), evidence, "needs_input")
        if intent.news:
            try:
                sample = await self.tool("sentiment_analyst", "get_headline_sample", {"symbol": intent.symbol}, parent)
                items = sample["items"]
                if items:
                    kind = "provider" if self.s.model.client else "fixture"
                    async with self.s.trace.span(parent, kind, "classify_headlines"):
                        tones = await self.s.model.headline_tones([i["title"] for i in items])
                    translations = {"positive": "บวก", "negative": "ลบ", "neutral": "เป็นกลาง", "unclear": "ไม่ชัดเจน"}
                    counts = ", ".join(f"{tones.count(t)} {self.say(t, translations[t])}" for t in dict.fromkeys(tones))
                    pieces.append(self.say(f"{intent.symbol} headline sample ({sample['source']}): {counts}.",
                                           f"ตัวอย่างพาดหัว {intent.symbol} ({sample['source']}) มีโทน {counts}"))
                    evidence.extend(f"{a['evidence_id']} · {sample['source']} · {a['published'][:10]} · {t} · {a['title']}"
                                    for a, t in zip(items, tones, strict=True))
                else:
                    pieces.append(self.say("No eligible headlines in the past seven days.", "ไม่มีพาดหัวที่เข้าเกณฑ์ในช่วงเจ็ดวัน"))
            except Exception:
                pieces.append(self.say("News analysis is unavailable.", "ยังวิเคราะห์ข่าวไม่ได้ในขณะนี้"))
                failed = True
        return Part(" ".join(pieces), evidence, "partial" if failed else "complete")

    async def specialist(self, parent, agent, handler, *args):
        try:
            async with self.s.trace.span(parent, "agent", agent) as span:
                part = await handler(span, *args)
                if part.status == "partial":
                    self.s.trace.outcomes[span] = "partial"
                part.agent = agent
                return part
        except Exception:
            return Part(self.say("This part of your question is unavailable.",
                                 "ข้อมูลสำหรับคำถามส่วนนี้ยังไม่พร้อม"), status="partial")

    async def run(self):
        trace = self.s.trace
        await trace.record(trace.store.start, trace.id)
        state = "failed"
        mode = "openai" if self.s.model.client else "demo"
        try:
            async with asyncio.timeout(20), trace.span(None, "agent", "companion") as root:
                profile = await self.tool("companion", "get_my_profile", {}, root)
                if not re.search(r"[a-zA-Zก-๙]", self.turn.question):
                    self.thai = profile.get("preferred_language") == "th"
                async with trace.span(root, "provider" if self.s.model.client else "fixture", "route_turn"):
                    intent = await self.s.model.route(self.turn.question, bool(self.turn.goal_id))
                if intent.news and intent.symbol is None:
                    intent.symbol = self.turn.symbol
                goal_id, parts, jobs = self.turn.goal_id, [], []
                if intent.goal and goal_id is None:
                    choices = (await self.tool("companion", "list_my_goals", {}, root))["goals"]
                    if intent.goal_category:
                        choices = [g for g in choices if g["category"] == intent.goal_category]
                    if len(choices) == 1:
                        goal_id = choices[0]["goal_id"]
                    else:
                        names = ", ".join(g["name"] for g in choices)
                        parts.append(Part(self.say("Select a saved goal.", "กรุณาเลือกเป้าหมายที่บันทึกไว้") + " " + names,
                                          status="needs_input"))
                if intent.reflection or intent.news:
                    jobs.append(self.specialist(root, "sentiment_analyst", self.sentiment, intent))
                if intent.goal and goal_id:
                    jobs.append(self.specialist(root, "goal_planner", self.goal, goal_id, intent.monthly_preview))
                if intent.portfolio:
                    jobs.append(self.specialist(root, "portfolio_analyst", self.portfolio))
                parts.extend(await asyncio.gather(*jobs))
                if not any(p.text for p in parts):
                    parts.append(Part(self.say("Ask about a savings goal, portfolio cash, or recent stock headlines.",
                                               "ลองถามเกี่ยวกับเป้าหมายการออม เงินสดในพอร์ต หรือข่าวหุ้นล่าสุด"),
                                      status="needs_input"))
                status = next((s for s in ("partial", "needs_input") if any(p.status == s for p in parts)), "complete")
                state = "partial" if status == "partial" else "completed"
                trace.outcomes[root] = state
                return Reply(answer="\n\n".join(p.text for p in parts if p.text),
                             presenters=[p.agent for p in parts if p.agent and p.text and p.status == "complete"],
                             evidence=[e for p in parts for e in p.evidence], status=status, mode=mode)
        finally:
            await trace.record(trace.store.finish, trace.id, state)
