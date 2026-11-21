"""Market closing prices for instruments in the Invest catalog."""
from datetime import UTC, datetime
from math import isfinite
from time import monotonic
from typing import Literal

import httpx
from pydantic import BaseModel

Period = Literal["1D", "1W", "1M", "1Y"]
WINDOWS = {"1D": ("1d", "5m"), "1W": ("5d", "30m"), "1M": ("1mo", "1d"), "1Y": ("1y", "1d")}


class PriceSeries(BaseModel):
    source: Literal["Yahoo Finance"]
    prices: list[float]
    timestamps: list[int]
    as_of: datetime


class HistoryUnavailable(Exception):
    pass


# Keys are bounded by the catalog and the four supported periods.
_cache: dict[tuple[str, Period], tuple[float, PriceSeries]] = {}


def parse_history(payload: dict, symbol: str) -> PriceSeries:
    result = payload["chart"]["result"][0]
    meta = result["meta"]
    if meta["symbol"] != symbol or meta["currency"] != "USD":
        raise ValueError("Unexpected market instrument or currency")

    closes = result["indicators"]["quote"][0]["close"]
    bars = {}
    for stamp, close in zip(result["timestamp"], closes, strict=True):
        if type(stamp) is int and stamp > 0 and type(close) in (int, float) and isfinite(close) and close > 0:
            bars[stamp] = close
    if not bars:
        raise ValueError("No usable market observations")

    timestamps = sorted(bars)
    return PriceSeries(source="Yahoo Finance", timestamps=timestamps, prices=[bars[t] for t in timestamps],
                       as_of=datetime.fromtimestamp(timestamps[-1], UTC))


async def price_series(symbol: str, period: Period) -> PriceSeries:
    key = (symbol, period)
    cached = _cache.get(key)
    if cached and monotonic() < cached[0]:
        return cached[1]

    provider_symbol = "BTC-USD" if symbol == "BTC" else symbol
    window, interval = WINDOWS[period]
    headers = {"User-Agent": "PrikThai/1.0 (investor companion research demo)", "Accept": "application/json"}
    async with httpx.AsyncClient(headers=headers, timeout=6.0) as client:
        for host in ("query1.finance.yahoo.com", "query2.finance.yahoo.com"):
            try:
                response = await client.get(f"https://{host}/v8/finance/chart/{provider_symbol}",
                                            params={"range": window, "interval": interval})
                response.raise_for_status()
                series = parse_history(response.json(), provider_symbol)
            except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, OverflowError, OSError):
                continue
            _cache[key] = (monotonic() + 60, series)
            return series
    raise HistoryUnavailable(f"Market history is unavailable for {symbol}.")
