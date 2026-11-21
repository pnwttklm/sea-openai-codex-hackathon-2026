"""Initialize the shared synthetic profile and goal plans. Reruns preserve saved plans."""
import asyncio
import os

from bson import ObjectId
from pymongo import AsyncMongoClient

from app.data.demo import DemoRepository
from app.data.future_you import DEMO_COLLECTION, DEMO_PROFILE_ID
from app.data.goal_plans import seed_plans


async def seed() -> None:
    if os.getenv("FUTURE_YOU_DEMO") != "1":
        raise SystemExit("Set FUTURE_YOU_DEMO=1 to seed the local demo collection.")
    subject = ObjectId(DEMO_PROFILE_ID)
    preferences = {"gender": "male", "risk_tolerance": "moderate", "preferred_language": "th"}
    async with AsyncMongoClient(os.environ["MONGODB_URI"], timeoutMS=5000) as mongo:
        database = os.getenv("MONGODB_DATABASE", "prik_thai_dev")
        collection = mongo[database][DEMO_COLLECTION]
        await collection.update_one({"_id": subject}, {"$setOnInsert": {
            "name": "Nobita", "age": 33, **preferences,
            "priorities": "Spend more time with family, keep an emergency fund, and retire near a garden in Thailand.",
        }}, upsert=True)
        await collection.update_one({"_id": subject, "name": "Niran"}, {"$set": {"name": "Nobita"}})
        for field, value in preferences.items():
            await collection.update_one({"_id": subject, field: {"$exists": False}}, {"$set": {field: value}})
        await seed_plans(collection, subject)
        await DemoRepository(mongo, database, shared_demo=True).get_paper_account()
    print("Shared demo profile, goal plans and paper account are ready.")


if __name__ == "__main__":
    asyncio.run(seed())
