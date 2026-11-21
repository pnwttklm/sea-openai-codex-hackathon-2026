from fastapi.testclient import TestClient
from pymongo.errors import ServerSelectionTimeoutError

from app.data.demo_seed import seed_document
from app.main import create_app
from app.services.demo import DemoService


class FixtureRepository:
    def __init__(self):
        from copy import deepcopy
        self.snapshot = deepcopy(seed_document())

    async def get(self):
        return self.snapshot

    async def set_monthly_target(self, target):
        self.snapshot["health_plan"]["monthly_target_thb"] = target


class UnavailableRepository:
    async def get(self):
        raise ServerSelectionTimeoutError("test-only connection failure")


def test_demo_routes_share_consistent_fixture(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    app = create_app()
    with TestClient(app) as client:
        app.state.demo = DemoService(FixtureRepository())
        portfolio = client.get("/api/v1/demo/portfolio").json()
        behavior = client.get("/api/v1/demo/behavior").json()
        amd = client.get("/api/v1/demo/stocks/AMD").json()
        assert portfolio["score"] == behavior["score"]
        assert [f["name"] for f in behavior["factors"]] == ["Contribution", "DCA Consistency", "Diversification", "Goal & Risk Fit"]
        updated = client.post("/api/v1/demo/behavior/target", json={"monthly_target_thb": 60000}).json()
        assert [f["score"] for f in updated["factors"][:2]] == [5, 5]
        assert updated["score"] < portfolio["score"]
        assert client.get("/api/v1/demo/portfolio").json()["score"] == updated["score"]
        assert client.post("/api/v1/demo/behavior/target", json={"monthly_target_thb": 0}).status_code == 422
        assert portfolio["value_thb"] == portfolio["history"]["1Y"]["values"][-1]
        assert sum(group["percent"] for group in portfolio["allocation"]) == 100
        assert [(h["symbol"], h["weight"]) for h in portfolio["holdings"]] == [
            ("VOO", 35), ("NVDA", 15), ("SGOV", 15), ("VT", 10), ("SE", 10), ("GLD", 10), ("BTC", 5)]
        assert amd["source"] == "demo"
        assert amd["price_cents"] == 17523
        assert len(amd["factors"]) == 5
        assert client.get("/api/v1/demo/stocks/UNKNOWN").status_code == 422
        assert client.get("/api/v1/demo/stocks/ZZZZ").status_code == 404


def test_database_unavailable_does_not_affect_liveness(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    app = create_app()
    with TestClient(app) as client:
        assert client.get("/api/v1/demo/portfolio").status_code == 503
        app.state.demo = DemoService(UnavailableRepository())
        response = client.get("/api/v1/demo/portfolio")
        assert response.status_code == 503
        assert response.json() == {"detail": "Demo database is temporarily unavailable"}
        assert client.get("/api/v1/health").status_code == 200


def test_sell_reflection_uses_webull_only_for_nvda(monkeypatch):
    from app.schemas.demo import NewsHeadline

    monkeypatch.delenv("MONGODB_URI", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    calls = []

    async def news(symbol):
        calls.append(symbol)
        return [NewsHeadline(title="Example NVIDIA news", publisher="Example publisher")]

    monkeypatch.setattr("app.services.demo.fetch_news", news)
    app = create_app()
    with TestClient(app) as client:
        app.state.demo = DemoService(FixtureRepository())
        assert client.get("/api/v1/demo/stocks/AMD/sell-reflection").json() == {"prompt": None}
        prompt = client.get("/api/v1/demo/stocks/NVDA/sell-reflection").json()["prompt"]
        assert prompt["demo_change_percent"] == -6
        assert prompt["goal_risk_fit_score"] == 5.8
        assert prompt["news_status"] == "available"
        assert prompt["headlines"][0]["title"] == "Example NVIDIA news"
        assert calls == ["NVDA"]


def test_sell_reflection_falls_back_without_webull(monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    monkeypatch.delenv("WEBULL_MCP_ACCESS_TOKEN", raising=False)
    app = create_app()
    with TestClient(app) as client:
        app.state.demo = DemoService(FixtureRepository())
        prompt = client.get("/api/v1/demo/stocks/NVDA/sell-reflection").json()["prompt"]
        assert prompt["news_status"] == "unavailable"
        assert prompt["headlines"] == []
        assert "original plan" in prompt["question"]
