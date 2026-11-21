"""Browser goal slugs map to stable, owner-scoped MongoDB identifiers."""
from hashlib import sha256
from math import ceil
from typing import Annotated

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from pymongo.errors import DuplicateKeyError

from app.data.future_you import DEMO_PROFILE_ID

Slug = Annotated[str, StringConstraints(pattern=r"^(wedding|retirement|time-machine|dream-home|emergency|custom-[a-zA-Z0-9-]{1,80})$")]
Amount = Annotated[float, Field(ge=0, le=1e12, multiple_of=0.01, allow_inf_nan=False)]
INITIAL = [
    ("wedding", "Marry Shizuka", 50000, 650000, 7000, 60),
    ("retirement", "Retirement in Thailand", 250000, 15000000, 12000, 300),
    ("time-machine", "Time machine", 50000, 240000, 5000, 36),
    ("dream-home", "Dream home", 150000, 1200000, 6000, 96),
    ("emergency", "Emergency fund", 100000, 300000, 10000, 20),
]


class GoalPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: Slug
    title: Annotated[str, StringConstraints(min_length=1, max_length=80, strip_whitespace=True)]
    saved: Amount
    target: Amount = Field(gt=0)
    monthly: Amount
    months: int = Field(strict=True, ge=1, le=1200)
    revision: int = Field(default=0, ge=0, strict=True)


def key(subject, slug):
    if str(subject) == DEMO_PROFILE_ID and slug == "retirement":
        return ObjectId("650000000000000000000002")
    return ObjectId(sha256(f"{subject}:{slug}".encode()).digest()[:12])


def fields(plan):
    category = {"dream-home": "home"}.get(plan.id, plan.id)
    return dict(kind="reserve" if plan.id == "emergency" else "goal", slug=plan.id, name=plan.title,
                category=category if category in {"wedding", "retirement", "time-machine", "home"} else "other",
                saved=plan.saved, monthly=plan.monthly, target=plan.target, months=plan.months,
                years=ceil(plan.months / 12))


def initial_plans():
    return [GoalPlan(id=i, title=t, saved=s, target=v, monthly=m, months=h) for i, t, s, v, m, h in INITIAL]


async def seed_plans(collection, subject):
    for plan in initial_plans():
        query = {"_id": key(subject, plan.id), "user_id": subject}
        await collection.update_one(query, {"$setOnInsert": fields(plan)}, upsert=True)
        # Preserve amounts on the retirement document written by the previous seeder.
        await collection.update_one({**query, "slug": {"$exists": False}},
                                    {"$set": {"slug": plan.id, "kind": "goal"}})


async def list_plans(collection, subject):
    result = []
    async for row in collection.find({"user_id": subject, "slug": {"$exists": True}}):
        result.append(GoalPlan(id=row["slug"], title=row["name"], saved=row["saved"], target=row["target"],
                               monthly=row["monthly"], months=row.get("months", row["years"] * 12),
                               revision=row.get("revision", 0)))
    order = {item[0]: n for n, item in enumerate(INITIAL)}
    return sorted(result, key=lambda plan: (order.get(plan.id, len(order)), plan.id))


async def save_plan(collection, subject, plan):
    query = {"_id": key(subject, plan.id), "user_id": subject,
             "revision": plan.revision if plan.revision else {"$in": [0, None]}}
    try:
        result = await collection.update_one(query, {"$set": fields(plan), "$inc": {"revision": 1}},
                                             upsert=plan.revision == 0)
    except DuplicateKeyError:
        return None
    if not result.matched_count and not result.upserted_id:
        return None
    return plan.model_copy(update={"revision": plan.revision + 1})
