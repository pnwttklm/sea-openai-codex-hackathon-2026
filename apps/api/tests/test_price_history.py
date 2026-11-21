import asyncio
from datetime import UTC, datetime
from unittest.mock import AsyncMock

import httpx
import pytest

from app.services import price_history


def test_market_history_keeps_only_matching_timestamped_closes():
    result = {
        "meta": {"symbol": "SGOV", "currency": "USD"},
        "timestamp": [30, 10, 20, 40, 30],
        "indicators": {"quote": [{"close": [100, 99.987, None, 0, 100.012]}]},
    }
    payload = {"chart": {"result": [result]}}
    series = price_history.parse_history(payload, "SGOV")
    assert series.prices == [99.987, 100.012]
    assert series.timestamps == [10, 30]
    assert series.as_of == datetime.fromtimestamp(30, UTC)
    with pytest.raises(ValueError):
        price_history.parse_history(payload, "NVDA")


def test_market_history_outage_never_returns_a_demo_price(monkeypatch):
    monkeypatch.setattr(price_history, "_cache", {})
    get = AsyncMock(side_effect=httpx.ConnectError("provider offline"))
    monkeypatch.setattr(httpx.AsyncClient, "get", get)
    with pytest.raises(price_history.HistoryUnavailable):
        asyncio.run(price_history.price_series("BTC", "1W"))
    url = get.await_args.args[0]
    assert url.endswith("/BTC-USD")
    assert get.await_args.kwargs["params"] == {"range": "5d", "interval": "30m"}
