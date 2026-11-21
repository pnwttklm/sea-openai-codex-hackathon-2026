from uuid import uuid4

from fastapi.testclient import TestClient

from app.data.demo_seed import seed_document
from app.main import create_app
from app.services.paper import PaperService
from app.schemas.demo import PaperFX


class FixedFX:
    async def latest(self):
        return PaperFX(rate_micros=33_500_000, as_of="2026-11-21")


class PaperFixture:
    def __init__(self):
        self.state = {"cash_cents": 100000, "positions": {"NVDA": 2}, "revision": 0, "fills": {}}

    async def get(self):
        return seed_document()

    async def get_paper_account(self):
        return self.state

    async def initialize_thb(self, revision, cash_satang, rate_micros):
        assert revision == self.state["revision"]
        self.state.update(cash_thb_satang=cash_satang, opening_fx_micros=rate_micros, revision=revision + 1)

    async def save_paper_fill(self, revision, order_id, account, fill):
        assert revision == self.state["revision"]
        self.state = {**self.state, **account, "fills": {**self.state["fills"], order_id: fill}}
        return True


def test_paper_orders_apply_once_and_enforce_available_cash_and_shares(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    app = create_app()
    path = "/api/v1/demo/paper-orders"
    order = {"order_id": str(uuid4()), "symbol": "NVDA", "side": "buy", "quantity": 1}

    with TestClient(app) as client:
        app.state.paper = PaperService(PaperFixture(), FixedFX())
        response = client.post(path, json=order)
        assert response.status_code == 200
        assert response.json()["account"] == {"cash_cents": 100000, "cash_thb_satang": 2638828, "positions": {"NVDA": 3}, "revision": 2}
        assert client.post(path, json=order).json() == response.json()
        assert client.post(path, json={**order, "quantity": 2}).status_code == 409
        assert client.post(path, json={**order, "order_id": str(uuid4()), "quantity": 100}).status_code == 409
        sell = {**order, "order_id": str(uuid4()), "side": "sell"}
        assert client.post(path, json={**sell, "quantity": 4}).status_code == 409
        assert client.post(path, json={**sell, "quantity": 0}).status_code == 422
        assert client.post(path, json={**sell, "fx_rate_micros": 32_000_000}).status_code == 409
        assert client.post(path, json=sell).status_code == 200
        account = client.get("/api/v1/demo/paper-account").json()
        assert account == {"cash_cents": 100000, "cash_thb_satang": 3350000, "positions": {"NVDA": 2}, "revision": 3}


def test_limit_orders_reserve_shares_and_cash_until_cancelled(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    app = create_app()
    path = "/api/v1/demo/paper-orders"

    def order(side, quantity, limit=None):
        return {
            "order_id": str(uuid4()), "symbol": "NVDA", "side": side, "quantity": quantity,
            "order_type": "market" if limit is None else "limit", "limit_price_cents": limit,
        }

    with TestClient(app) as client:
        app.state.paper = PaperService(PaperFixture(), FixedFX())
        buy = order("buy", 4, 20000)
        sell = order("sell", 2, 23000)
        assert client.post(path, json=buy).json()["status"] == "open"
        assert client.post(path, json=sell).json()["status"] == "open"
        assert len(client.get(f"{path}/open").json()) == 2
        assert client.get("/api/v1/demo/paper-account").json()["cash_thb_satang"] == 3350000
        assert client.post(path, json=order("buy", 1)).status_code == 409
        assert client.post(path, json=order("sell", 1)).status_code == 409
        for pending in (buy, sell):
            cancel_url = f"{path}/{pending['order_id']}/cancel"
            cancelled = client.post(cancel_url).json()
            assert cancelled["status"] == "cancelled"
            assert client.post(cancel_url).json() == cancelled
        assert client.get(f"{path}/open").json() == []
        marketable = client.post(path, json=order("buy", 1, 22000)).json()
        assert marketable["status"] == "filled"
        assert marketable["price_cents"] == 21229
        assert client.post(f"{path}/{marketable['order_id']}/cancel").status_code == 409
        invalid = {**order("buy", 1), "order_type": "limit"}
        assert client.post(path, json=invalid).status_code == 422
