from contextlib import nullcontext
from datetime import UTC, datetime

from pymongo import AsyncMongoClient
from pymongo.errors import DuplicateKeyError

from app.data.demo_seed import DEMO_RATE, seed_document

FIXTURE_ID = "prik-thai-demo-health-v1"


class DemoRepository:
    def __init__(self, client: AsyncMongoClient, database: str, *, shared_demo: bool = False) -> None:
        self.shared_demo = shared_demo
        self.account_id = "nobita-500k-v1" if shared_demo else "nobita-paper-v1"
        self.collection = client[database]["demo_snapshots"]
        self.paper = client[database]["paper_accounts"]

    async def get(self, trace=None, parent=None) -> dict:
        query = {"_id": FIXTURE_ID}
        async with trace.span(parent, "db", "demo_snapshots.find_one") if trace else nullcontext():
            document = await self.collection.find_one(query)
        if document is None:
            fixture = seed_document()
            try:
                await self.collection.update_one(query, {"$setOnInsert": fixture}, upsert=True)
            except DuplicateKeyError:
                # A concurrent request inserted this version first.
                pass
            document = await self.collection.find_one(query)
        if document is None:
            raise RuntimeError("Demo snapshot was unavailable after initialization")
        return document

    async def set_monthly_target(self, target: int) -> None:
        await self.get()
        await self.collection.update_one({"_id": FIXTURE_ID}, {"$set": {"health_plan.monthly_target_thb": target}})

    async def get_paper_account(self, trace=None, parent=None) -> dict:
        query = {"_id": self.account_id}
        async with trace.span(parent, "db", "paper_accounts.find_one") if trace else nullcontext():
            document = await self.paper.find_one(query)
        if document is None:
            snapshot = await self.get()
            opening = {"revision": 0, "created_at": datetime.now(UTC), "fills": {}}
            if self.shared_demo:
                portfolio = snapshot["portfolio"]
                # THB NAV times percent weight gives the position value in satang.
                positions = {
                    h["symbol"]: round(portfolio["value_thb"] * h["weight"] * 1_000_000
                                       / (h["price_cents"] * DEMO_RATE), 12)
                    for h in portfolio["holdings"]
                }
                opening.update(positions=positions, cash_cents=0, cash_thb_satang=0, opening_fx_micros=DEMO_RATE)
            else:
                opening.update(positions=dict.fromkeys(snapshot["stocks"], 10), cash_cents=1_000_000)
            try:
                await self.paper.update_one(
                    query,
                    {"$setOnInsert": opening},
                    upsert=True,
                )
            except DuplicateKeyError:
                pass
            document = await self.paper.find_one(query)
        if document is None:
            raise RuntimeError("Paper account was unavailable after initialization")
        return document

    async def save_paper_fill(
        self, revision: int, order_id: str, account: dict, fill: dict,
    ) -> bool:
        result = await self.paper.update_one(
            {"_id": self.account_id, "revision": revision},
            {"$set": {**account, "as_of": datetime.now(UTC), f"fills.{order_id}": fill}},
        )
        return result.modified_count == 1

    async def initialize_thb(self, revision: int, cash_satang: int, rate_micros: int) -> None:
        await self.paper.update_one(
            {"_id": self.account_id, "revision": revision, "cash_thb_satang": None},
            {
                "$set": {"cash_thb_satang": cash_satang, "opening_fx_micros": rate_micros},
                "$inc": {"revision": 1},
            },
        )
