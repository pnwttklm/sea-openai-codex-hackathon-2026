from typing import Protocol
from uuid import UUID

from app.schemas.demo import PaperAccount, PaperFill, PaperFX, PaperOrder
from app.services.fx import FXRates, to_satang


class PaperRepository(Protocol):
    async def get(self) -> dict: ...
    async def get_paper_account(self) -> dict: ...
    async def initialize_thb(self, revision: int, cash_satang: int, rate_micros: int) -> None: ...
    async def save_paper_fill(self, revision: int, order_id: str, account: dict, fill: dict) -> bool: ...


class PaperConflict(Exception):
    pass


class PaperService:
    def __init__(self, repository: PaperRepository, rates: FXRates | None = None) -> None:
        self.repository = repository
        self.rates = rates or FXRates()

    async def fx(self) -> PaperFX:
        return await self.rates.latest()

    async def _balance_state(self, rate: PaperFX | None = None) -> dict:
        for _ in range(5):
            state = await self.repository.get_paper_account()
            if state.get("cash_thb_satang") is not None:
                return state
            if rate is None:
                rate = await self.fx()
            await self.repository.initialize_thb(
                state["revision"], to_satang(state["cash_cents"], rate.rate_micros), rate.rate_micros,
            )
        raise PaperConflict("The account changed. Please try again.")

    async def account(self) -> PaperAccount:
        return PaperAccount.model_validate(await self._balance_state())

    async def open_orders(self) -> list[PaperFill]:
        state = await self.repository.get_paper_account()
        return [PaperFill.model_validate(order) for order in state["fills"].values() if order.get("status") == "open"]

    async def cancel(self, order_id: UUID) -> PaperFill | None:
        for _ in range(5):
            state = await self.repository.get_paper_account()
            document = state["fills"].get(str(order_id))
            if document is None:
                return None
            order = PaperFill.model_validate(document)
            if order.status == "filled":
                raise PaperConflict("Filled orders cannot be cancelled")
            if order.status == "cancelled":
                return order

            account = PaperAccount.model_validate(state)
            updated = account.model_copy(update={"revision": account.revision + 1})
            cancelled = order.model_copy(update={"status": "cancelled", "account": updated})
            if await self.repository.save_paper_fill(
                account.revision, str(order_id), updated.model_dump(), cancelled.model_dump(mode="json"),
            ):
                return cancelled

        raise PaperConflict("The account changed. Please try again.")

    async def fill(self, order: PaperOrder) -> PaperFill | None:
        stock = (await self.repository.get())["stocks"].get(order.symbol)
        if stock is None:
            return None

        order_id = str(order.order_id)
        price = stock["price_cents"]
        buying = order.side == "buy"
        limit = order.limit_price_cents
        fills_now = limit is None or (price <= limit if buying else price >= limit)
        total = (price if fills_now else limit) * order.quantity
        rate = None

        for _ in range(5):
            state = await self.repository.get_paper_account()
            prior = state["fills"].get(order_id)
            if prior is not None:
                if PaperOrder.model_validate(prior) != order:
                    raise PaperConflict("Order ID already used for a different order")
                return PaperFill.model_validate(prior)
            if len(state["fills"]) >= 1000:
                raise PaperConflict("The local demo has reached its order limit")

            if rate is None:
                rate = await self.fx()
            if order.fx_rate_micros is not None and order.fx_rate_micros != rate.rate_micros:
                raise PaperConflict("USD/THB rate changed. Refresh the rate and review the order again.")
            if state.get("cash_thb_satang") is None:
                await self._balance_state(rate)
                continue

            total_thb = to_satang(total, rate.rate_micros)
            before = PaperAccount.model_validate(state)
            cash_thb = state["cash_thb_satang"]
            open_orders = [item for item in state["fills"].values() if item.get("status") == "open"]
            reserved_cash = sum(
                item["total_thb_satang"] if item.get("total_thb_satang") is not None
                else to_satang(item["total_cents"], state["opening_fx_micros"])
                for item in open_orders if item["side"] == "buy"
            )
            reserved_shares = sum(
                item["quantity"] for item in open_orders if item["side"] == "sell" and item["symbol"] == order.symbol
            )
            shares = before.positions.get(order.symbol, 0)
            if buying and total_thb > cash_thb - reserved_cash:
                raise PaperConflict("Insufficient cash")
            if not buying and order.quantity > shares - reserved_shares:
                raise PaperConflict("Insufficient shares")

            after = before.model_copy(update={"revision": before.revision + 1})
            if fills_now:
                after.cash_thb_satang = cash_thb + (-total_thb if buying else total_thb)
                after.positions = {**before.positions, order.symbol: shares + (order.quantity if buying else -order.quantity)}

            fill = PaperFill(
                **order.model_dump(), account=after,
                status="filled" if fills_now else "open", price_cents=price if fills_now else None, total_cents=total,
                total_thb_satang=total_thb, fx=rate,
            )
            if await self.repository.save_paper_fill(
                before.revision, order_id, after.model_dump(), fill.model_dump(mode="json"),
            ):
                return fill

        raise PaperConflict("The account changed. Please try again.")
