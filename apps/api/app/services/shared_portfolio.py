"""Value the demo's single paper account for every portfolio consumer."""
from datetime import UTC, date, datetime
from decimal import Decimal

from bson import ObjectId

from app.data.demo_seed import DEMO_RATE
from app.data.future_you import DEMO_PROFILE_ID
from app.schemas.demo import PaperFX
from app.schemas.future_you import PortfolioSnapshot
from app.services.fx import to_satang



class DemoFX:
    async def latest(self):
        return PaperFX(rate_micros=DEMO_RATE, as_of=date.today(), source="Demo")


class SharedPortfolio:
    def __init__(self, repository):
        self.repo = repository

    async def snapshot(self, data, trace=None, parent=None):
        state = await self.repo.get_paper_account(trace=trace, parent=parent)
        cash = state.get("cash_thb_satang")
        if cash is None:
            cash = to_satang(state["cash_cents"], DEMO_RATE)
        base = data["portfolio"]
        originals = {h["symbol"]: h for h in base["holdings"]}
        holdings, buckets = [], {"Cash": cash}
        for symbol, quantity in state["positions"].items():
            if quantity <= 0:
                continue
            quote = data["stocks"][symbol]
            value = to_satang(Decimal(str(quantity)) * quote["price_cents"], DEMO_RATE)
            bucket = {"BTC": "Bitcoin", "SGOV": "Treasury bills", "GLD": "Gold"}.get(symbol, "Equities")
            buckets[bucket] = buckets.get(bucket, 0) + value
            holdings.append((originals.get(symbol, {**quote, "trend": [0, round(100 * quote["change_percent"])]}), value))
        total = sum(buckets.values())
        weights = [{**h, "weight": round(100 * v / total, 4)} for h, v in holdings] if total else []
        balance = Decimal(total) / 100
        history = {}
        for period, hist in base["history"].items():
            # Fixture history is illustrative. Scale its series to this account's current NAV.
            values = [round(v * balance / base["value_thb"]) for v in hist["values"]]
            history[period] = {**hist, "values": values, "change_thb": values[-1] - values[0]}
        as_of = state.get("as_of") or state.get("created_at") or datetime(2026, 11, 21, tzinfo=UTC)
        if as_of.tzinfo is None:
            as_of = as_of.replace(tzinfo=UTC)
        return {**base, "value_thb": float(balance), "cash_thb": cash / 100, "as_of": as_of,
                "holdings": weights, "history": history,
                "allocation": [dict(name=k, percent=100 * v / total)
                               for k, v in sorted(buckets.items(), key=lambda pair: -pair[1]) if v > 0]}

    async def latest_portfolio(self, subject, trace=None, parent=None):
        if subject != ObjectId(DEMO_PROFILE_ID):
            return None
        data = await self.repo.get(trace=trace, parent=parent)
        portfolio = await self.snapshot(data, trace, parent)
        return PortfolioSnapshot(as_of=portfolio["as_of"], total_value_thb=portfolio["value_thb"],
            cash_thb=portfolio["cash_thb"], holdings=[dict(symbol=h["symbol"], weight_pct=h["weight"])
                                                      for h in portfolio["holdings"]])
