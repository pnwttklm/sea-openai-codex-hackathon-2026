import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.ai.companion_model import CompanionModel
from app.ai.trade_review import ReflectionQuestion, review_trade
from app.data.agent_traces import Trace
from app.schemas.demo import TradeDraft


@pytest.mark.parametrize("side,symbol,has_goal", [("buy", "NVDA", True), ("sell", "AMD", False)])
def test_trade_review_uses_current_plan_on_both_sides(side, symbol, has_goal):
    snapshot = {"stocks": {symbol: {}}, "health_plan": {"monthly_target_thb": 45000,
                "goals": [{"name": "Edited goal", "years": 2.5, "symbols": ["NVDA"]}]}}
    service = SimpleNamespace(snapshot=AsyncMock(return_value=snapshot))
    model = CompanionModel(client=object())
    model.parse = AsyncMock(return_value=ReflectionQuestion(question="Does this fit the plan you saved?"))
    draft = TradeDraft(side=side, symbol=symbol, quantity=2, order_type="limit", estimated_satang=1500000)
    trace = Trace(AsyncMock())
    review = asyncio.run(review_trade(draft, service, model, trace))
    assert review.source == "ai" and review.monthly_target_thb == 45000
    assert bool(review.goals) == has_goal
    payload = model.parse.await_args.args[-1]
    assert payload["side"] == side and payload["estimated_satang"] == 1500000
    if has_goal:
        assert review.goals[0].name == "Edited goal" and review.goals[0].years == 2.5

    model.parse.side_effect = ValueError("unusable provider result")
    review = asyncio.run(review_trade(draft, service, model, trace))
    assert review.source == "demo" and symbol in review.question
    assert trace.store.finish.await_args.args[-1] == "partial"


def test_instrument_rating_checks_actual_goal_and_preserves_unscored():
    from app.ai.instrument_rating import rate_instrument
    from app.data.demo_seed import seed_document

    service = SimpleNamespace(snapshot=AsyncMock(return_value=seed_document()))
    model = CompanionModel()
    for symbol, expected in [("VOO", [True, True, True]), ("NVDA", [False, False, False]), ("AAPL", [])]:
        result = asyncio.run(rate_instrument(symbol, service, model, Trace(AsyncMock())))
        assert [check.fits for check in result.checks] == expected
        assert result.source == "demo"
