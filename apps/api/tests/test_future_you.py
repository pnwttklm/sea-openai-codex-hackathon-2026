import base64
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from openai import AsyncOpenAI

from app.ai import future_media, future_voice
from app.main import create_app
from app.schemas.future_you import FutureProfile, PortfolioSnapshot, SavedGoal

ASSESSMENT_URL = "/api/v1/future-you/assessment"
VOICE_URL = "/api/v1/future-you/voice"
CONTEXT_URL = "/api/v1/future-you/context"
LOCAL_ORIGIN = "http://localhost:3000"
ORIGIN = {"Origin": LOCAL_ORIGIN}
WEDDING = {"goal": "wedding", "saved": 50_000, "target": 650_000, "monthly": 7_000, "years": 5}
OFFER = "v=0\r\ns=offer\r\n"
ANSWER = "v=0\r\ns=answer\r\n"
USER_ID = ObjectId("650000000000000000000009")
GOAL_ID = ObjectId("650000000000000000000010")
VOICE_OFFER = {"goal_id": str(GOAL_ID), "sdp": OFFER}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", f"{LOCAL_ORIGIN},https://example.com")
    monkeypatch.delenv("FUTURE_YOU_VOICE_ENABLED", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("FUTURE_YOU_USER_ID", raising=False)
    monkeypatch.delenv("FUTURE_YOU_DEMO", raising=False)
    with TestClient(create_app()) as client:
        yield client


@pytest.fixture
def saved_profile(client):
    goal = SavedGoal(**WEDDING, id=str(GOAL_ID), goal_name="Our garden wedding")
    portfolio = PortfolioSnapshot(
        as_of="2026-11-21T00:00:00Z", total_value_thb="940000.50", cash_thb="120000",
        holdings=[{"symbol": "Global equity fund", "weight_pct": 50}],
    )
    repository = SimpleNamespace(
        get_profile=AsyncMock(return_value=FutureProfile(
            name="Mali", age=31, priorities="Keep an emergency fund", gender="หญิง",
            risk_tolerance="moderate", preferred_language="th",
        )),
        get_goal=AsyncMock(return_value=goal),
        list_goals=AsyncMock(return_value=[goal]),
        latest_portfolio=AsyncMock(return_value=portfolio),
    )
    client.app.state.future_you_user_id = str(USER_ID)
    client.app.state.future_you_repository = repository
    return repository


def test_context_uses_server_selected_profile(client, saved_profile):
    assert client.get(CONTEXT_URL, headers={"Origin": "https://example.com"}).status_code == 403
    response = client.get(CONTEXT_URL, headers=ORIGIN)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "profile_name": "Mali",
        "profile_available": True,
        "years_from_now": 25,
        "future_age": 56,
        "voice_style": "feminine",
        "voice_available": False,
        "media_available": False,
        "is_demo": False,
        "goals": [{"id": str(GOAL_ID), "name": "Our garden wedding", "saved": 50_000,
                   "target": 650_000, "years": 5, "future_age": 36}],
    }
    saved_profile.get_profile.assert_awaited_once_with(USER_ID)
    saved_profile.list_goals.assert_awaited_once_with(USER_ID)


def test_context_with_no_profile_or_goal(client):
    response = client.get(CONTEXT_URL, headers=ORIGIN)
    assert response.status_code == 200
    assert response.json()["goals"] == []


def test_voice_rejects_missing_goal_for_profile(client, monkeypatch, saved_profile):
    monkeypatch.setenv("FUTURE_YOU_VOICE_ENABLED", "1")
    monkeypatch.setenv("OPENAI_API_KEY", "fake-test-key")
    saved_profile.get_goal.return_value = None
    response = client.post(VOICE_URL, json=VOICE_OFFER, headers=ORIGIN)
    assert response.status_code == 404
    saved_profile.get_goal.assert_awaited_once_with(USER_ID, GOAL_ID)
    saved_profile.latest_portfolio.assert_not_awaited()


def test_wedding_demo_projection(client):
    response = client.post(ASSESSMENT_URL, json=WEDDING)

    assert response.status_code == 200
    assert response.json() == {
        "projected": 525_142.68,
        "gap": 124_857.32,
        "on_track": False,
        "required_monthly": 8_884,
        "annual_rate": 0.04,
        "voice_available": False,
        "media_available": False,
    }


def test_zero_rate_boundaries(client):
    plan = {"goal": "home", "saved": 0, "target": 100_000_000, "monthly": 10_000_000, "years": 1}
    response = client.post(ASSESSMENT_URL, json=plan)
    assert response.status_code == 200
    result = response.json()
    assert result["projected"] == 120_000_000
    assert result["gap"] == 0
    assert result["on_track"] is True
    assert result["required_monthly"] == 8_333_334
    assert result["annual_rate"] == 0

    response = client.post(ASSESSMENT_URL, json={**plan, "saved": plan["target"], "monthly": 0})
    assert response.json()["required_monthly"] == 0


@pytest.mark.parametrize("overrides", [{"years": 0}, {"years": 51}, {"monthly": 1.5}, {"saved": -1}])
def test_assessment_rejects_invalid_plan(client, overrides):
    response = client.post(ASSESSMENT_URL, json={**WEDDING, **overrides})
    assert response.status_code == 422


def test_voice_disabled(client):
    headers = {"Origin": LOCAL_ORIGIN}
    assessment = client.post(ASSESSMENT_URL, json=WEDDING, headers=headers)
    assert assessment.json()["voice_available"] is False
    response = client.post(VOICE_URL, json=VOICE_OFFER, headers=headers)
    assert response.status_code == 503


@pytest.mark.parametrize("headers", [{}, {"Origin": "http://localhost:9999"}, {"Origin": "https://example.com"}])
def test_voice_rejects_unapproved_origins(client, monkeypatch, headers):
    monkeypatch.setenv("FUTURE_YOU_VOICE_ENABLED", "1")
    monkeypatch.setenv("OPENAI_API_KEY", "fake-test-key")

    assessment = client.post(ASSESSMENT_URL, json=WEDDING, headers=headers)
    assert assessment.json()["voice_available"] is False
    response = client.post(VOICE_URL, json=VOICE_OFFER, headers=headers)
    assert response.status_code == 403


@pytest.mark.parametrize("upstream_status, upstream_body, expected_status, override, expected_voice, overview", [
    (201, ANSWER, 200, None, "marin", False),
    (201, ANSWER, 200, "masculine", "marin", False),
    (201, ANSWER, 200, None, "marin", True),
    (201, "bad answer", 502, None, "marin", False),
    (401, "private upstream detail", 502, None, "marin", False),
])
def test_voice_client_secret_exchange(
    client, monkeypatch, saved_profile, upstream_status, upstream_body, expected_status, override, expected_voice, overview,
):
    monkeypatch.setenv("FUTURE_YOU_VOICE_ENABLED", "1")
    monkeypatch.setenv("OPENAI_API_KEY", "fake-test-key")
    monkeypatch.setenv("OPENAI_REALTIME_MODEL", "test-realtime-model")
    if override:
        saved_profile.latest_portfolio.return_value = None
    if overview:
        saved_profile.list_goals.return_value.append(SavedGoal(
            goal="home", id="650000000000000000000011", goal_name="A home near family",
            saved=90_000, target=450_000, monthly=5000, years=7,
        ))
    requests = []

    def provider(request):
        requests.append(request)
        if request.url.path.endswith("/client_secrets"):
            return httpx.Response(200, json={"value": "ephemeral-example", "expires_at": 2000000000,
                                             "session": {"type": "realtime"}})
        return httpx.Response(upstream_status, text=upstream_body, headers={"Content-Type": "application/sdp"})

    def mock_openai(**kwargs):
        transport = httpx.MockTransport(provider)
        return AsyncOpenAI(**kwargs, base_url="https://example.com/v1/", http_client=httpx.AsyncClient(transport=transport))

    monkeypatch.setattr(future_voice, "AsyncOpenAI", mock_openai)
    headers = {"Origin": LOCAL_ORIGIN}
    assessment = client.post(ASSESSMENT_URL, json=WEDDING, headers=headers)
    assert assessment.json()["voice_available"] is True
    offer = {"sdp": OFFER} if overview else VOICE_OFFER
    response = client.post(VOICE_URL, json={**offer, "voice_style": override}, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.text == ANSWER
        assert response.headers["content-type"] == "application/sdp"
        assert response.headers["cache-control"] == "no-store"
    else:
        assert response.json() == {"detail": "Could not start the voice session. Try again."}
    assert len(requests) == 2
    mint, call = requests
    assert mint.url.path == "/v1/realtime/client_secrets"
    assert mint.headers["Authorization"] == "Bearer fake-test-key"
    assert call.url.path == "/v1/realtime/calls"
    assert call.headers["Authorization"] == "Bearer ephemeral-example"
    assert call.headers["Content-Type"] == "application/sdp"
    assert call.content == OFFER.encode()
    session = json.loads(mint.content)["session"]
    assert session["model"] == "test-realtime-model"
    assert session["type"] == "realtime"
    assert "THB 525,142.68" in session["instructions"]
    assert "Our garden wedding" in session["instructions"]
    assert "Keep an emergency fund" in session["instructions"]
    assert '"risk_tolerance": "moderate"' in session["instructions"]
    if overview:
        assert '"age_in_scenario": 56' in session["instructions"]
        assert "A home near family" in session["instructions"]
        saved_profile.list_goals.assert_awaited_once_with(USER_ID)
        saved_profile.get_goal.assert_not_awaited()
    else:
        assert '"age_in_scenario": 36' in session["instructions"]
        saved_profile.get_goal.assert_awaited_once_with(USER_ID, GOAL_ID)
    assert "Open in Thai" in session["instructions"]
    assert "ค่ะ for statements and acknowledgments, คะ for direct questions" in session["instructions"]
    if override:
        assert '"portfolio_today": null' in session["instructions"]
    else:
        assert '"total_value_thb": "940000.50"' in session["instructions"]
        assert '"as_of": "2026-11-21T00:00:00Z"' in session["instructions"]
        assert "Global equity fund" in session["instructions"]
    assert session["audio"]["output"]["voice"] == expected_voice
    assert session["audio"]["input"]["transcription"]["model"] == "gpt-realtime-whisper"
    assert session["audio"]["input"]["turn_detection"]["interrupt_response"] is True
    assert session["audio"]["input"]["format"] == session["audio"]["output"]["format"] == {"type": "audio/pcm", "rate": 24000}
    assert session["tools"] == []
    saved_profile.latest_portfolio.assert_awaited_once_with(USER_ID)


@pytest.mark.parametrize("voice_match", ["feminine", None])
def test_overview_portrait_returns_automatic_voice_match(client, monkeypatch, saved_profile, voice_match):
    monkeypatch.setenv("FUTURE_YOU_MEDIA_ENABLED", "1")
    monkeypatch.setenv("OPENAI_API_KEY", "fake-test-key")
    png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jTuoAAAAASUVORK5CYII="
    )
    generated = png + b"generated"
    image_api = AsyncMock(return_value=generated)
    match = AsyncMock(return_value=voice_match)
    monkeypatch.setattr("app.api.routes.future_you.generate_portrait", image_api)
    monkeypatch.setattr("app.api.routes.future_you.match_portrait_voice", match)

    response = client.post("/api/v1/future-you/portrait", content=png, headers={**ORIGIN, "Content-Type": "image/png"})

    assert response.status_code == 200
    assert response.content == generated
    assert response.headers.get("X-Future-Voice-Style") == voice_match
    assert "X-Future-Voice-Style" in response.headers["access-control-expose-headers"]
    image_api.assert_awaited_once_with(png, "other", 25, "fake-test-key")
    match.assert_awaited_once_with(generated, "fake-test-key")
    saved_profile.get_goal.assert_not_awaited()


def test_media_uses_image_api_and_passes_only_the_scene(client, monkeypatch, saved_profile):
    monkeypatch.setenv("FUTURE_YOU_MEDIA_ENABLED", "1")
    monkeypatch.setenv("OPENAI_API_KEY", "fake-test-key")
    monkeypatch.setattr("app.api.routes.future_you.which", lambda _: "/fake/ffmpeg")
    png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jTuoAAAAASUVORK5CYII="
    )
    requests = []

    def provider(request):
        requests.append(request)
        data = b"GIF89a-test" if b'name="frame_count"' in request.content else png
        return httpx.Response(200, json={"created": 0, "data": [{"b64_json": base64.b64encode(data).decode()}]})

    def mock_openai(**kwargs):
        transport = httpx.MockTransport(provider)
        return AsyncOpenAI(**kwargs, base_url="https://example.com/v1/", http_client=httpx.AsyncClient(transport=transport))

    async def mock_encode(gif):
        assert gif == b"GIF89a-test"
        return b"test mp4"

    monkeypatch.setattr(future_media, "AsyncOpenAI", mock_openai)
    monkeypatch.setattr(future_media, "encode_mp4", mock_encode)
    origin = {"Origin": LOCAL_ORIGIN}
    plan = client.post(ASSESSMENT_URL, json=WEDDING, headers=origin)
    assert plan.json()["media_available"] is True
    image = client.post(f"/api/v1/future-you/portrait/{GOAL_ID}", content=png, headers={**origin, "Content-Type": "image/png"})
    assert image.status_code == 200
    assert image.content == png
    assert image.headers["cache-control"] == "no-store"
    assert requests[0].url.path == "/v1/images/edits"
    saved_profile.get_goal.assert_awaited_once_with(USER_ID, GOAL_ID)
    assert png in requests[0].content
    assert b"same person 5 years older" in requests[0].content
    assert b"650000" not in requests[0].content and b"650,000" not in requests[0].content
    video = client.post("/api/v1/future-you/video", content=png, headers={**origin, "Content-Type": "image/png"})
    assert video.status_code == 200
    assert video.headers["content-type"] == "video/mp4"
    assert video.content == b"test mp4"
    assert requests[1].url.path == "/v1/images/edits"
    assert b'name="output_format"\r\n\r\ngif' in requests[1].content
    assert b'name="frame_count"\r\n\r\n12' in requests[1].content
    assert png in requests[1].content


def test_media_disabled_and_nonlocal_origins(client):
    url = "/api/v1/future-you/image?goal=wedding&years=5"
    assert client.post(url, json=WEDDING, headers={"Origin": LOCAL_ORIGIN}).status_code == 503
    assert client.post(url, json=WEDDING, headers={"Origin": "https://example.com"}).status_code == 403


def test_portrait_requires_valid_photo(client, monkeypatch):
    monkeypatch.setenv("FUTURE_YOU_MEDIA_ENABLED", "1")
    monkeypatch.setenv("OPENAI_API_KEY", "fake-test-key")
    monkeypatch.setattr("app.api.routes.future_you.which", lambda _: "/fake/ffmpeg")
    url = "/api/v1/future-you/image?goal=wedding&years=5"
    origin = {"Origin": LOCAL_ORIGIN}
    assert client.post(url, json=WEDDING, headers=origin).status_code == 415
    assert client.post(url, content=b"not a PNG", headers={**origin, "Content-Type": "image/png"}).status_code == 422
