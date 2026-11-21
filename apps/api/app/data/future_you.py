from datetime import UTC, datetime

from bson import ObjectId
from bson.codec_options import CodecOptions, TypeRegistry
from bson.decimal128 import DecimalDecoder
from pymongo.asynchronous.database import AsyncDatabase

from app.schemas.future_you import FutureProfile, PortfolioSnapshot, SavedGoal

PROFILE_FIELDS = {
    "name": 1, "age": 1, "priorities": 1, "gender": 1, "voice_style": 1,
    "risk_tolerance": 1, "preferred_language": 1,
}
GOAL_FIELDS = {"name": 1, "category": 1, "saved": 1, "target": 1, "monthly": 1, "years": 1}
PORTFOLIO_FIELDS = {"_id": 0, "as_of": 1, "total_value_thb": 1, "cash_thb": 1, "holdings": 1}
DEMO_COLLECTION = "future_you_demo"
DEMO_PROFILE_ID = "650000000000000000000001"


def parse_goal(document: dict) -> SavedGoal:
    return SavedGoal.model_validate({
        **document,
        "id": str(document["_id"]),
        "goal_name": document.get("name"),
        "goal": document.get("category", "other"),
    })


class FutureYouRepository:
    def __init__(self, database: AsyncDatabase, *, demo: bool = False):
        self.profiles = database[DEMO_COLLECTION if demo else "profiles"]
        self.goals = database[DEMO_COLLECTION if demo else "goals"]
        self.portfolios = database.get_collection(
            DEMO_COLLECTION if demo else "portfolios",
            codec_options=CodecOptions(tz_aware=True, type_registry=TypeRegistry([DecimalDecoder()])),
        )
        self.goal_filter = {"kind": {"$ne": "portfolio"}} if demo else {}
        self.portfolio_filter = {"kind": "portfolio"} if demo else {}

    async def get_profile(self, user_id: ObjectId) -> FutureProfile | None:
        document = await self.profiles.find_one({"_id": user_id}, PROFILE_FIELDS)
        return FutureProfile.model_validate(document) if document is not None else None

    async def list_goals(self, user_id: ObjectId) -> list[SavedGoal]:
        cursor = self.goals.find({"user_id": user_id, **self.goal_filter}, GOAL_FIELDS).sort("_id", 1)
        return [parse_goal(document) async for document in cursor]

    async def get_goal(self, user_id: ObjectId, goal_id: ObjectId) -> SavedGoal | None:
        document = await self.goals.find_one({"_id": goal_id, "user_id": user_id, **self.goal_filter}, GOAL_FIELDS)
        return parse_goal(document) if document is not None else None

    async def latest_portfolio(self, user_id: ObjectId) -> PortfolioSnapshot | None:
        document = await self.portfolios.find_one(
            {"user_id": user_id, "as_of": {"$lte": datetime.now(UTC)}, **self.portfolio_filter},
            PORTFOLIO_FIELDS,
            sort=[("as_of", -1), ("_id", -1)],
        )
        return PortfolioSnapshot.model_validate(document) if document is not None else None
