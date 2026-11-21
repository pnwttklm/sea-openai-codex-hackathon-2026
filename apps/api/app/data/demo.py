from contextlib import nullcontext
from datetime import UTC, datetime

from pymongo import AsyncMongoClient
from pymongo.errors import DuplicateKeyError

from app.data.demo_seed import seed_document

FIXTURE_ID = "prik-thai-demo-health-v1"


class DemoRepository:
    def __init__(self, client: AsyncMongoClient, database: str) -> None:
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
        query = {"_id": "nobita-paper-v1"}
        async with trace.span(parent, "db", "paper_accounts.find_one") if trace else nullcontext():
            document = await self.paper.find_one(query)
        if document is None:
            snapshot = await self.get()
            positions = dict.fromkeys(snapshot["stocks"], 10)
            try:
                await self.paper.update_one(
                    query,
                    {"$setOnInsert": {"revision": 0, "created_at": datetime.now(UTC), "cash_cents": 1_000_000, "positions": positions, "fills": {}}},
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
            {"_id": "nobita-paper-v1", "revision": revision},
            {"$set": {**account, "as_of": datetime.now(UTC), f"fills.{order_id}": fill}},
        )
        return result.modified_count == 1

    async def initialize_thb(self, revision: int, cash_satang: int, rate_micros: int) -> None:
        await self.paper.update_one(
            {"_id": "nobita-paper-v1", "revision": revision, "cash_thb_satang": None},
            {
                "$set": {"cash_thb_satang": cash_satang, "opening_fx_micros": rate_micros},
                "$inc": {"revision": 1},
            },
        )
