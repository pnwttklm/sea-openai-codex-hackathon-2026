import asyncio
import os
from uuid import uuid4
from unittest.mock import AsyncMock

from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo import AsyncMongoClient
from pydantic import ValidationError
import pytest

from app.ai.companion_model import CompanionModel
from app.ai.future_world import design_landmark
from app.data.future_you import DEMO_PROFILE_ID
from app.data.goal_plans import GoalPlan, resolve_appearance, save_plan
from app.data.world_conversations import WorldConversations
from app.main import create_app
from app.schemas.future_world import WorldReply
from app.services.future_world import goal_visual

CAR = dict(id="custom-car", title="Mint-green electric car", saved=20000, target=50000, monthly=2000, months=24)


def test_visual_contract_and_savings_edges():
    with pytest.raises(ValidationError):
        WorldReply(answer="Shall we explore?", caption="Some goals", mode="offline", goal_id=None)
    with pytest.raises(ValidationError):
        WorldReply(answer="Which goal?", caption="  ", visual={"type": "goals", "goals": []}, mode="offline", goal_id=None)
    plan = GoalPlan(**CAR)
    graph, _ = goal_visual(plan, 250000)
    assert [p.month for p in graph.current.points] == [0, 12, 15]
    assert [p.balance for p in graph.current.points] == [20000, 44000, 50000]
    assert [p.balance for p in graph.proposed.points] == [20000, 50000, 50000]
    assert graph.unit == "THB"
    for saved, monthly, target, months in [(21, 0, 20, 0), (0, 0, 20, None), (.01, .01, .07, 6)]:
        v, _ = goal_visual(GoalPlan(**{**CAR, "saved": saved, "monthly": monthly, "target": target}), None)
        assert v.months_to_target == months


@pytest.mark.skipif(not os.environ.get("AGENT_TEST_MONGODB_URI"), reason="requires disposable MongoDB")
def test_town_history_goal_ownership_and_appearance(monkeypatch):
    uri = os.environ["AGENT_TEST_MONGODB_URI"]
    db_name = "world_test_" + uuid4().hex
    for k, v in {"MONGODB_URI": uri, "MONGODB_DATABASE": db_name, "FUTURE_YOU_DEMO": "1",
                 "FUTURE_YOU_USER_ID": "", "OPENAI_COMPANION_MODEL": "", "CORS_ORIGINS": "http://localhost:3113"}.items():
        monkeypatch.setenv(k, v)
    owner, other = ObjectId(DEMO_PROFILE_ID), ObjectId()
    cid = str(uuid4())

    async def verify_database():
        async with AsyncMongoClient(uri) as client:
            db = client[db_name]
            conversations = db.future_world_conversations
            history = await WorldConversations(conversations, owner).read(cid)
            assert len(history) == 3
            assert await WorldConversations(conversations, other).read(cid) == []
            assert await db.future_you_demo.count_documents({"slug": CAR["id"]}) == 1
            with pytest.raises(KeyError):
                await resolve_appearance(db.future_you_demo, other, CAR["id"], AsyncMock())
            # A delayed art result must not overwrite an intervening rename.
            renamed = GoalPlan(**{**CAR, "revision": 2, "title": "A yellow house"})
            async def delayed(title):
                await save_plan(db.future_you_demo, owner, renamed)
                return await design_landmark(CompanionModel(), title)
            with pytest.raises(ValueError, match="renamed"):
                await resolve_appearance(db.future_you_demo, owner, CAR["id"], delayed)

    async def cleanup():
        async with AsyncMongoClient(uri) as client:
            await client.drop_database(db_name)

    try:
        with TestClient(create_app(), headers={"Origin": "http://localhost:3113"}) as client:
            world = "/api/v1/future-world"
            goals = "/api/v1/companion/goals"
            def turn(n, conversation=cid, **args):
                return client.post(world + "/turns", json={"conversation_id": conversation, "turn": n, **args})
            assert turn(0, str(uuid4())).json()["visual"] == {"type": "goals", "goals": []}
            model = client.app.state.companion_model
            model.client, model.parse = object(), AsyncMock(side_effect=ValueError("unavailable art"))
            assert client.post(goals, json=CAR).status_code == 200
            model.client = None
            assert turn(0, goal_id="custom-absent").status_code == 404
            opening = turn(0, goal_id=CAR["id"])
            assert opening.json()["visual"]["months_to_target"] == 15
            assert turn(0, goal_id=CAR["id"]).json() == opening.json()
            assert turn(0).status_code == 409
            assert turn(2, extra_monthly=500).status_code == 409
            reply = turn(1, question="500 more").json()
            assert reply["mode"] == "offline" and reply["goal_id"] == CAR["id"]
            assert reply["visual"]["proposed"]["months_to_target"] == 12 and "12 months" in reply["answer"]
            assert turn(0, str(uuid4())).json()["goal_id"] is None
            assert client.get(goals).json()[0]["monthly"] == 2000
            assert client.get(goals, headers={"Origin": "https://example.org"}).status_code == 403

            model.client, model.parse = object(), AsyncMock(side_effect=ValueError("invalid model output"))
            assert turn(2, extra_monthly=500).status_code == 502
            assert turn(0, str(uuid4()), goal_id=CAR["id"], offline=True).json()["mode"] == "offline"
            path = world + "/landmarks/" + CAR["id"]
            assert client.post(path).status_code == 502
            assert "appearance" not in client.get(goals).json()[0]
            model.client = None
            assert turn(2, extra_monthly=500).json()["visual"]["current"]["monthly"] == 2000
            art = client.post(path).json()
            assert art == {"kind": "car", "color": "#98E2BB", "accessory": "none", "revision": 1}
            model.client = object()
            assert client.post(path).json() == art
            assert client.get(goals).json()[0]["appearance"] == art
            assert client.post(goals, json={**CAR, "revision": 1, "title": "Blue house"}).status_code == 200
            assert "appearance" not in client.get(goals).json()[0]
            asyncio.run(verify_database())
    finally:
        asyncio.run(cleanup())


def test_configured_sdk_returns_structured_art_topic_and_answer():
    import json
    import httpx
    from openai import AsyncOpenAI
    from app.ai.future_world import choose_topic, narrate

    outputs = iter([{"kind": "car", "color": "#98E2BB", "accessory": "none"},
                    {"goal_id": "custom-car", "contribution": "extra", "amount": 500},
                    {"text": "You could reach your car in 12 months. Want to compare another amount?"}])
    def upstream(request):
        assert request.url.path == "/v1/responses"
        body = json.loads(request.content)
        assert body["store"] is False and body["text"]["format"]["type"] == "json_schema"
        assert body["model"] == "test-model"
        return httpx.Response(200, json={"id": "resp_synthetic", "object": "response", "created_at": 1,
            "model": body["model"], "status": "completed", "output": [{"id": "msg_synthetic", "type": "message",
            "role": "assistant", "status": "completed", "content": [{"type": "output_text",
            "annotations": [], "text": json.dumps(next(outputs))}]}]})

    async def exercise():
        http = httpx.AsyncClient(transport=httpx.MockTransport(upstream))
        async with AsyncOpenAI(api_key="test", base_url="https://example.test/v1", http_client=http) as client:
            model, plan = CompanionModel(client, "test-model"), GoalPlan(**CAR)
            assert (await design_landmark(model, plan.title)).color == "#98E2BB"
            topic = await choose_topic(model, "500 more", plan.id, {plan.id: plan}, [])
            assert topic.amount == 500 and topic.goal_id == plan.id
            visual, caption = goal_visual(plan, 250000)
            assert "12 months" in await narrate(model, "500 more", visual, caption, [])
    asyncio.run(exercise())
