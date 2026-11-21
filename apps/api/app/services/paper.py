from typing import Protocol

from app.schemas.demo import PaperAccount, PaperFill, PaperOrder


class PaperRepository(Protocol):
    async def get(self) -> dict: ...
    async def get_paper_account(self) -> dict: ...
    async def save_paper_fill(self, revision: int, order_id: str, account: dict, fill: dict) -> bool: ...


class PaperConflict(Exception):
    pass


class PaperService:
    def __init__(self, repository: PaperRepository) -> None:
        self.repository = repository

    async def account(self) -> PaperAccount:
        return PaperAccount.model_validate(await self.repository.get_paper_account())

    async def fill(self, order: PaperOrder) -> PaperFill | None:
        stock = (await self.repository.get())["stocks"].get(order.symbol)
        if stock is None:
            return None

        order_id = str(order.order_id)
        price = stock["price_cents"]
        total = price * order.quantity
        for _ in range(5):
            state = await self.repository.get_paper_account()
            prior = state["fills"].get(order_id)
            if prior is not None:
                if PaperOrder.model_validate(prior) != order:
                    raise PaperConflict("Order ID already used for a different order")
                return PaperFill.model_validate(prior)

            if len(state["fills"]) >= 1000:
                raise PaperConflict("The local demo has reached its order limit")

            before = PaperAccount.model_validate(state)
            shares = before.positions.get(order.symbol, 0)
            buying = order.side == "buy"
            if buying and total > before.cash_cents:
                raise PaperConflict("Insufficient paper cash")
            if not buying and order.quantity > shares:
                raise PaperConflict("Insufficient paper shares")

            after = PaperAccount(
                revision=before.revision + 1,
                cash_cents=before.cash_cents - total if buying else before.cash_cents + total,
                positions={**before.positions, order.symbol: shares + order.quantity if buying else shares - order.quantity},
            )
            fill = PaperFill(**order.model_dump(), account=after, price_cents=price, total_cents=total)
            saved = await self.repository.save_paper_fill(
                before.revision, order_id, after.model_dump(), fill.model_dump(mode="json"),
            )
            if saved:
                return fill

        raise PaperConflict("The paper account changed. Please try again.")
