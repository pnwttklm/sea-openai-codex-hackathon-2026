"""Opt-in MongoDB integration, scoped to a fresh database owned by this test."""
import asyncio
import os
from uuid import uuid4

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo import AsyncMongoClient

from app.data.future_you import DEMO_PROFILE_ID
from app.data.seed_future_you_demo import seed
from app.main import create_app


@pytest.mark.skipif(not os.environ.get("AGENT_TEST_MONGODB_URI"), reason="requires disposable MongoDB")
def test_shared_goals_account_journal_and_ops(monkeypatch):
    uri = os.environ["AGENT_TEST_MONGODB_URI"]
    db_name = "agent_check_" + uuid4().hex
    for key, value in {"MONGODB_URI": uri, "MONGODB_DATABASE": db_name, "FUTURE_YOU_DEMO": "1",
                       "FUTURE_YOU_USER_ID": "", "OPENAI_COMPANION_MODEL": "", "AGENT_OPS_SECRET": "a"*32,
                       "CORS_ORIGINS": "http://localhost:3113"}.items():
        monkeypatch.setenv(key, value)

    async def cleanup():
        async with AsyncMongoClient(uri) as client:
            await client.drop_database(db_name)

    try:
        asyncio.run(seed())
        app = create_app()
        with TestClient(app, headers={"Origin": "http://localhost:3113"}) as client:
            base = "/api/v1"
            plans = client.get(base + "/companion/goals").json()
            wedding = next(plan for plan in plans if plan["id"] == "wedding")
            edited = dict(wedding, months=61, monthly=8884.25, saved=50000.75)
            assert client.post(base + "/companion/goals", json=edited).status_code == 200
            assert client.post(base + "/companion/goals", json=edited).status_code == 409
            context = client.get(base + "/future-you/context").json()
            saved = next(g for g in context["goals"] if g["name"] == wedding["title"])
            assert saved["saved"] == 50000.75
            assert all(g["name"] != "Emergency fund" for g in context["goals"])
            def ask(question, **args):
                r = client.post(base + "/companion/turns", json={"question": question, **args})
                assert r.status_code == 200, r.text
                return r.json()
            assert "61 months" in ask("Am I on track?", goal_id=saved["id"])["answer"]
            assert ask("Am I on track?", goal_id=str(ObjectId()))["status"] == "partial"

            account = client.get(base + "/demo/paper-account").json()
            order = dict(symbol="AMD", side="buy", quantity=1, order_id=str(uuid4()))
            receipt = client.post(base + "/demo/paper-orders", json=order).json()
            assert receipt["status"] == "filled"
            assert receipt["account"]["positions"]["AMD"] == account["positions"]["AMD"] + 1
            assert client.post(base + "/demo/paper-orders", json=order).json() == receipt
            portfolio = client.get(base + "/demo/portfolio").json()
            cash = receipt["account"]["cash_thb_satang"]/100
            assert portfolio["cash_thb"] == cash
            assert f"{cash:,.2f}".removesuffix(".00") in ask("What is my portfolio cash?")["answer"]
            assert portfolio["score"] == client.get(base + "/demo/behavior").json()["score"]

            note = {"id": str(uuid4()), "text": "Synthetic reflection"}
            for _ in range(2):
                assert client.post(base + "/companion/journal", json=note).status_code == 200
            assert [entry["text"] for entry in client.get(base + "/companion/journal").json()] == [note["text"]]
            assert client.get(base + "/ops/agent-runs").status_code == 401
            assert client.post(base + "/ops/session", json={"secret":"incorrect"}).status_code == 403
            assert client.post(base + "/ops/session", json={"secret":"a"*32}).status_code == 204
            assert client.get(base + "/ops/agent-runs").status_code == 200
            assert client.delete(base + "/ops/session").status_code == 204
            assert client.get(base + "/ops/agent-runs").status_code == 401
    finally:
        asyncio.run(cleanup())
