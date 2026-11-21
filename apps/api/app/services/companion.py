from datetime import UTC, datetime, timedelta

from bson import ObjectId

from app.ai.reflection import fetch_news
from app.data.demo_seed import OTHER_QUOTES, QUOTES
from app.data.future_you import DEMO_COLLECTION
from app.schemas.demo import NewsHeadline
from app.services.future_you import assess_plan


class CompanionServices:
    """Read-only services bound to a server-selected synthetic subject for one turn."""
    def __init__(self, repository, subject, question, trace, model, fixture_news):
        self.repo, self.subject, self.question = repository, subject, question
        self.trace, self.model, self.fixture_news = trace, model, fixture_news

    async def profile(self, parent):
        async with self.trace.span(parent, "db", DEMO_COLLECTION + ".find_one"):
            profile = await self.repo.get_profile(self.subject)
        if profile is None:
            raise LookupError("Demo profile missing")
        return profile.model_dump(include={"preferred_language", "risk_tolerance"})

    async def goals(self, parent):
        async with self.trace.span(parent, "db", DEMO_COLLECTION + ".find"):
            goals = await self.repo.list_goals(self.subject)
        return {"goals": [dict(goal_id=g.id, name=g.goal_name, category=g.goal) for g in goals]}

    async def projection(self, parent, goal_id, monthly=None):
        async with self.trace.span(parent, "db", DEMO_COLLECTION + ".find_one"):
            goal = await self.repo.get_goal(self.subject, ObjectId(goal_id))
        if goal is None:
            raise LookupError("Goal unavailable")
        def assess(plan):
            result = assess_plan(plan)
            return dict(goal=plan.goal_name, months=plan.months or plan.years * 12, monthly_thb=float(plan.monthly),
                        target_thb=float(plan.target), projected_thb=f"{result.projected:.2f}",
                        gap_thb=f"{result.gap:.2f}", required_monthly_thb=result.required_monthly,
                        annual_rate=result.annual_rate)
        async with self.trace.span(parent, "service", "assess_plan"):
            baseline = assess(goal)
            if monthly is None:
                return baseline
            return dict(baseline=baseline, preview=assess(goal.model_copy(update={"monthly": monthly})),
                        delta_monthly_thb=float(monthly - goal.monthly))

    async def portfolio(self, parent):
        if self.repo.shared_portfolio:
            snapshot = await self.repo.shared_portfolio.latest_portfolio(self.subject, self.trace, parent)
        else:
            async with self.trace.span(parent, "db", DEMO_COLLECTION + ".find_one"):
                snapshot = await self.repo.latest_portfolio(self.subject)
        if snapshot is None:
            raise LookupError("Snapshot unavailable")
        return snapshot.model_dump(mode="json", exclude_none=True)

    async def reflection(self, parent):
        kind = "provider" if self.model.client else "fixture"
        async with self.trace.span(parent, kind, "classify_current_turn"):
            return (await self.model.reflect(self.question)).model_dump()

    async def headlines(self, parent, symbol):
        if symbol not in {row[0] for row in [*QUOTES, *OTHER_QUOTES]}:
            raise ValueError("Unknown symbol")
        now = datetime.now(UTC)
        if self.fixture_news:
            async with self.trace.span(parent, "fixture", "news.sample"):
                samples = {
                    "VT": ("How VT spreads its holdings across global stock markets", "Where VT and VOO overlap in US equities"),
                    "VOO": ("Inside VOO’s exposure to the S&P 500", "Portfolio review compares VOO with global equity funds"),
                    "SGOV": ("Inside SGOV’s short-term Treasury holdings", "How Treasury bill yields affect SGOV income"),
                    "GLD": ("How GLD tracks the price of gold", "Portfolio review examines gold exposure through GLD"),
                    "QQQ": ("Portfolio review examines concentration in QQQ", "How the Nasdaq-100 determines QQQ holdings"),
                    "BTC": ("Bitcoin volatility draws attention in portfolio review", "How Bitcoin exposure changes portfolio risk"),
                }
                titles = samples.get(symbol, (f"{symbol} beats quarterly earnings estimates",
                                              f"{symbol} cuts guidance for next quarter"))
                articles = [NewsHeadline(title=title, published_at=(now - timedelta(days=i)).isoformat())
                            for i, title in enumerate(titles, 1)]
        else:
            async with self.trace.span(parent, "provider", "news.fetch"):
                articles = await fetch_news(symbol)
                if articles is None:
                    raise RuntimeError("News unavailable")
        dated = []
        for article in articles:
            try:
                published = datetime.fromisoformat(article.published_at or "")
                if published.tzinfo and now - timedelta(days=7) <= published <= now:
                    dated.append((published, article))
            except ValueError:
                continue
        items, titles = [], set()
        for date, article in sorted(dated, key=lambda entry: entry[0], reverse=True):
            title = article.title.strip().casefold()
            if title and title not in titles:
                titles.add(title)
                items.append(dict(evidence_id=f"{symbol}-{len(items)+1}", title=article.title,
                                  published=date.isoformat(), publisher=article.publisher, url=article.url))
            if len(items) == 3:
                break
        return dict(symbol=symbol, as_of=now.isoformat(), source="demo" if self.fixture_news else "Webull",
                    coverage="available" if items else "empty", items=items)
