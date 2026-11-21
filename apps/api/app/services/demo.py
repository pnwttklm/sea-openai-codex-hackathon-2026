from typing import Protocol

from app.ai.reflection import choose_question, fetch_news
from app.schemas.demo import Behavior, Portfolio, SellPrompt, SellReflection, Stock


from app.services.health import investor_health


class SnapshotReader(Protocol):
    async def get(self) -> dict: ...
    async def set_monthly_target(self, target: int) -> None: ...


class DemoService:
    def __init__(self, repository: SnapshotReader) -> None:
        self.repository = repository

    async def portfolio(self) -> Portfolio:
        snapshot = await self.repository.get()
        health = investor_health(snapshot)
        return Portfolio(**snapshot["portfolio"], score=health.score, score_label=health.label)

    async def behavior(self) -> Behavior:
        return investor_health(await self.repository.get())

    async def update_target(self, target: int) -> Behavior:
        await self.repository.set_monthly_target(target)
        return await self.behavior()

    async def stock(self, symbol: str) -> Stock | None:
        stock = (await self.repository.get())["stocks"].get(symbol)
        return Stock.model_validate(stock) if stock is not None else None

    async def sell_reflection(self, symbol: str) -> SellReflection | None:
        snapshot = await self.repository.get()
        if symbol not in snapshot["stocks"]:
            return None

        behavior = investor_health(snapshot)
        fit = next(f for f in behavior.factors if f.name == "Goal & Risk Fit")
        if symbol != "NVDA" or fit.score >= 10:
            return SellReflection(prompt=None)

        news = await fetch_news(symbol)
        headlines = news or []
        question = await choose_question(headlines)
        return SellReflection(prompt=SellPrompt(
            demo_change_percent=-6,
            behavior_score=behavior.score,
            goal_risk_fit_score=fit.score,
            question=question,
            news_status="unavailable" if news is None else "available" if headlines else "empty",
            headlines=headlines,
        ))
