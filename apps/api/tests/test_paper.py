from uuid import uuid4

from fastapi.testclient import TestClient

from app.data.demo_seed import seed_document
from app.main import create_app
from app.services.paper import PaperService


class PaperFixture:
    def __init__(self):
        self.state = {"cash_cents": 100000, "positions": {"NVDA": 2}, "revision": 0, "fills": {}}

    async def get(self):
        return seed_document()

    async def get_paper_account(self):
        return self.state

    async def save_paper_fill(self, revision, order_id, account, fill):
        assert revision == self.state["revision"]
        self.state = {**account, "fills": {**self.state["fills"], order_id: fill}}
        return True


def test_paper_orders_apply_once_and_enforce_available_cash_and_shares(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    app = create_app()
    path = "/api/v1/demo/paper-orders"
    order = {"order_id": str(uuid4()), "symbol": "NVDA", "side": "buy", "quantity": 1}

    with TestClient(app) as client:
        app.state.paper = PaperService(PaperFixture())
        response = client.post(path, json=order)
        assert response.status_code == 200
        assert response.json()["account"] == {"cash_cents": 78771, "positions": {"NVDA": 3}, "revision": 1}
        assert client.post(path, json=order).json() == response.json()
        assert client.post(path, json={**order, "quantity": 2}).status_code == 409
        assert client.post(path, json={**order, "order_id": str(uuid4()), "quantity": 100}).status_code == 409
        sell = {**order, "order_id": str(uuid4()), "side": "sell"}
        assert client.post(path, json={**sell, "quantity": 4}).status_code == 409
        assert client.post(path, json={**sell, "quantity": 0}).status_code == 422
        assert client.post(path, json=sell).status_code == 200
        account = client.get("/api/v1/demo/paper-account").json()
        assert account == {"cash_cents": 100000, "positions": {"NVDA": 2}, "revision": 2}
