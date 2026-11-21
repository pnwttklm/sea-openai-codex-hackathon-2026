from datetime import UTC, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from time import monotonic

import httpx

from app.schemas.demo import PaperFX


class FXUnavailable(Exception):
    pass


def to_satang(usd_cents: int | Decimal, rate_micros: int) -> int:
    return int((usd_cents * rate_micros + 500_000) // 1_000_000)


class FXRates:
    def __init__(self) -> None:
        self.cached: PaperFX | None = None
        self.expires_at = 0.0

    async def latest(self) -> PaperFX:
        if self.cached is not None and monotonic() < self.expires_at:
            return self.cached
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get("https://api.frankfurter.dev/v2/rate/USD/THB")
                response.raise_for_status()
            payload = response.json(parse_float=Decimal)
            if payload["base"] != "USD" or payload["quote"] != "THB":
                raise ValueError("Currency mismatch")
            micros = int((Decimal(payload["rate"]) * 1_000_000).to_integral_value(rounding=ROUND_HALF_UP))
            rate = PaperFX(rate_micros=micros, as_of=payload["date"])
            if abs(datetime.now(UTC).date() - rate.as_of) > timedelta(days=7):
                raise ValueError("FX rate is out of date")
        except (httpx.HTTPError, KeyError, TypeError, ValueError, ArithmeticError) as error:
            raise FXUnavailable("USD/THB reference rate unavailable. Please try again.") from error
        self.cached = rate
        self.expires_at = monotonic() + 300
        return rate
