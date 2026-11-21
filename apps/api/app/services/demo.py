from typing import Protocol

from app.ai.reflection import choose_question, fetch_news
from app.schemas.demo import Behavior, Portfolio, SellPrompt, SellReflection, Stock


class SnapshotReader(Protocol):
    async def get(self) -> dict: ...


class DemoService:
    def __init__(self, repository: SnapshotReader) -> None:
        self.repository = repository

    async def portfolio(self) -> Portfolio:
        return Portfolio.model_validate((await self.repository.get())["portfolio"])

    async def behavior(self) -> Behavior:
        return Behavior.model_validate((await self.repository.get())["behavior"])

    async def stock(self, symbol: str) -> Stock | None:
        stock = (await self.repository.get())["stocks"].get(symbol)
        return Stock.model_validate(stock) if stock is not None else None

    async def sell_reflection(self, symbol: str) -> SellReflection | None:
        snapshot = await self.repository.get()
        if symbol not in snapshot["stocks"]:
            return None

        behavior = Behavior.model_validate(snapshot["behavior"])
        if symbol != "NVDA" or behavior.label != "Low":
            return SellReflection(prompt=None)

        news = await fetch_news(symbol)
        headlines = news or []
        question = await choose_question(headlines)
        decision = next((factor.score for factor in behavior.factors if factor.name == "Decision"), None)
        return SellReflection(prompt=SellPrompt(
            demo_change_percent=-6,
            behavior_score=behavior.score,
            decision_score=decision,
            question=question,
            news_status="unavailable" if news is None else "available" if headlines else "empty",
            headlines=headlines,
        ))
