from fastapi.testclient import TestClient
from app.main import create_app


def test_health_contract():
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_unknown_route_is_not_found():
    with TestClient(create_app()) as client:
        assert client.get("/api/v1/unknown").status_code == 404
