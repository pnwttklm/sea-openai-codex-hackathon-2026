"""Insert the local Future You fixture into its dedicated demo collection."""

import asyncio
import os
from datetime import UTC, datetime

from bson import ObjectId
from pymongo import AsyncMongoClient

from app.data.future_you import DEMO_COLLECTION, DEMO_PROFILE_ID


async def seed() -> None:
    if os.getenv("FUTURE_YOU_DEMO") != "1":
        raise SystemExit("Set FUTURE_YOU_DEMO=1 to seed the local demo collection.")
    profile_id = ObjectId(DEMO_PROFILE_ID)
    personalization = {"gender": "male", "risk_tolerance": "moderate", "preferred_language": "th"}
    records = [
        {
            "_id": profile_id,
            "name": "Niran",
            "age": 33,
            "priorities": "Spend more time with family, keep an emergency fund, and retire near a garden in Thailand.",
            **personalization,
        },
        {
            "_id": ObjectId("650000000000000000000002"),
            "user_id": profile_id,
            "name": "Retire near family in Thailand",
            "category": "retirement",
            "saved": 320_000,
            "target": 5_000_000,
            "monthly": 12_000,
            "years": 25,
        },
        {
            "_id": ObjectId("650000000000000000000003"),
            "kind": "portfolio",
            "user_id": profile_id,
            "as_of": datetime.now(UTC),
            "total_value_thb": 800_000,
            "cash_thb": 120_000,
            "holdings": [
                {"symbol": "Global equity fund", "weight_pct": 50},
                {"symbol": "Thai bond fund", "weight_pct": 35},
                {"symbol": "Cash", "weight_pct": 15},
            ],
        },
    ]
    async with AsyncMongoClient(os.environ["MONGODB_URI"], timeoutMS=5000) as mongo:
        collection = mongo[os.getenv("MONGODB_DATABASE", "prik_thai_dev")][DEMO_COLLECTION]
        for record in records:
            await collection.update_one({"_id": record["_id"]}, {"$setOnInsert": record}, upsert=True)
        for field, value in personalization.items():
            await collection.update_one({"_id": profile_id, field: {"$exists": False}}, {"$set": {field: value}})
    print(f"Synthetic profile, goal, and portfolio are available in {DEMO_COLLECTION}.")


if __name__ == "__main__":
    asyncio.run(seed())
