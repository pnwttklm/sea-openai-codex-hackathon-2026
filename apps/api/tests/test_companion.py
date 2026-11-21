import asyncio
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from bson import ObjectId

from app.ai.companion_model import CompanionModel
from app.ai.companion_runtime import TurnRunner
from app.ai.companion_tools import call_tool
from app.data.agent_traces import Trace
from app.schemas.companion import Turn
from app.schemas.demo import NewsHeadline
from app.schemas.future_you import FutureProfile, SavedGoal
from app.services.companion import CompanionServices


def services(q, subject=None):
    subject = subject or ObjectId()
    goal = SavedGoal(id=str(ObjectId()), goal_name="Wedding", goal="wedding", years=5,
                     monthly=7000, saved=50000, target=650000)
    repo = SimpleNamespace(get_profile=AsyncMock(return_value=FutureProfile(preferred_language="th")),
                           list_goals=AsyncMock(return_value=[goal]), get_goal=AsyncMock(return_value=goal),
                           shared_portfolio=None, latest_portfolio=AsyncMock(return_value=None))
    return CompanionServices(repo, subject, q, Trace(AsyncMock()), CompanionModel(), True)


def test_parallel_runs_isolate_tools_and_traces():
    async def run():
        q = "กังวลว่าเงินเก็บจะไม่พอแต่งงาน ต้องเก็บเดือนละเท่าไหร่"
        first, second = services(q), services("What if I save 8884 for my wedding?")
        a, b = await asyncio.gather(TurnRunner(first, Turn(question=q)).run(),
                                    TurnRunner(second, Turn(question=second.question)).run())
        assert "8,884" in a.answer and "เข้าใจว่าคุณกังวล" in a.answer
        assert set(a.presenters) == {"sentiment_analyst", "goal_planner"}
        assert "Preview" in b.answer
        for s in (first, second):
            calls = [call.args for call in s.trace.store.begin_span.await_args_list]
            assert all(call[0] == s.trace.id for call in calls)
            assert s.repo.get_goal.await_args.args[0] == s.subject
            assert s.question not in str(calls)
            assert s.repo.get_goal.return_value.monthly == 7000
        assert first.trace.id != second.trace.id
        with pytest.raises(PermissionError):
            await call_tool("goal_planner", "read_my_portfolio", {}, first, None)
        with pytest.raises(ValueError):
            await call_tool("companion", "get_my_profile", {"user_id": str(second.subject)}, first, None)
    asyncio.run(run())


def test_sentiment_attribution_news_sources_and_partial(monkeypatch):
    async def run():
        for text in ("I'm not worried about my wedding", "เพื่อนบอกว่าเขากังวล"):
            assert CompanionModel.demo_reflection(text).cue == "unclear"
        s = services("Recent news about NVDA and my wedding goal?")
        s.fixture_news = False
        now = datetime.now(UTC)
        article = NewsHeadline(title="NVDA beats estimates", published_at=now.isoformat())
        old = article.model_copy(update={"title": "Older news", "published_at": (now-timedelta(days=8)).isoformat()})
        fetch = AsyncMock(return_value=[article, article, old, NewsHeadline(title="Undated")])
        monkeypatch.setattr("app.services.companion.fetch_news", fetch)
        turn = Turn(question=s.question)
        reply = await TurnRunner(s, turn).run()
        assert "1 positive" in reply.answer and sum("NVDA-1" in e for e in reply.evidence) == 1
        fetch.return_value = []
        assert "No eligible headlines" in (await TurnRunner(s, turn).run()).answer
        fetch.return_value = None
        reply = await TurnRunner(s, turn).run()
        assert reply.status == "partial" and "8,884" in reply.answer
    asyncio.run(run())


def test_openai_routing_uses_typed_output_and_validates_attribution():
    from app.schemas.companion import Intent, Reflection
    responses = AsyncMock()
    model = CompanionModel(SimpleNamespace(responses=responses), "configured-test-model")
    intent = Intent(goal=False, goal_category=None, monthly_preview=None, portfolio=True,
                    reflection=False, news=False, symbol=None)
    responses.parse.return_value = SimpleNamespace(output_parsed=intent)
    assert asyncio.run(model.route("What is my portfolio value?", False)) == intent
    assert responses.parse.await_args.kwargs["text_format"] is Intent
    responses.parse.return_value = SimpleNamespace(output_parsed=Reflection(cue="concern", phrase="invented"))
    assert asyncio.run(model.reflect("Let's check the target")).cue == "unclear"
    responses.parse.return_value = SimpleNamespace(output_parsed=None)
    with pytest.raises(ValueError):
        asyncio.run(model.route("A question", False))


def test_news_reading_keeps_articles_when_model_analysis_is_incomplete():
    from app.ai.stock_news import stock_news
    from app.schemas.companion import NewsReading

    s = services("")
    s.model.client = object()
    s.model.parse = AsyncMock(return_value=NewsReading(summary="This sample looks at fund overlap.", tones=["neutral"]))
    result = asyncio.run(stock_news(s, "VT"))
    assert result.source == "demo"
    assert len(result.items) == 2 and all("VT" in article.title for article in result.items)
    assert result.summary is None and all(article.tone is None for article in result.items)
    assert s.trace.store.finish.await_args.args[-1] == "partial"
