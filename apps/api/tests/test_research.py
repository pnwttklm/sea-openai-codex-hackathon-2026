import asyncio
import json
from types import SimpleNamespace as NS

from fastapi.testclient import TestClient

from app.ai.research import run_research
from app.main import create_app
from app.schemas.demo import AgentChat, NewsHeadline


class FakeResponses:
    def __init__(self, outputs):
        self.outputs = iter(outputs)
        self.requests = []

    async def create(self, **request):
        self.requests.append({**request, "input": list(request["input"])})
        return next(self.outputs)


def test_agent_calls_only_public_news_tool_and_keeps_source():
    async def news(symbol):
        assert symbol == "AMD"
        return [NewsHeadline(title="Example announcement", url="https://example.com/press")]

    responses = FakeResponses([
        NS(output=[NS(type="function_call", name="get_stock_news", arguments='{"symbol":"AMD"}', call_id="call_test")]),
        NS(status="completed", output_text="The announcement discusses planned investment.", output=[]),
    ])
    result = asyncio.run(run_research(
        NS(responses=responses),
        AgentChat(symbol="NVDA", messages=[{"role": "user", "text": "Any news about AMD?"}]),
        "test-model", webull_enabled=True, reader=news,
    ))
    assert result is not None
    assert result.sources[0].url == "https://example.com/press"
    action = responses.requests[1]["input"][-1]
    assert action["type"] == "function_call_output"
    assert json.loads(action["output"])["headlines"][0]["title"] == "Example announcement"


def test_web_search_citation_surfaces_without_webull():
    citation = NS(type="url_citation", title="SEC filing", url="https://www.sec.gov/example")
    output = [NS(type="message", content=[NS(type="output_text", annotations=[citation])])]
    responses = FakeResponses([NS(status="completed", output_text="See the SEC filing.", output=output)])
    result = asyncio.run(run_research(
        NS(responses=responses),
        AgentChat(symbol="AMD", messages=[{"role": "user", "text": "What changed recently?"}]),
        "test-model", webull_enabled=False,
    ))
    assert responses.requests[0]["tools"] == [{"type": "web_search"}]
    assert result is not None
    assert result.sources[0].title == "SEC filing"


def test_chat_validation_and_unconfigured_state(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with TestClient(create_app()) as client:
        url = "/api/v1/demo/agent/chat"
        assert client.post(url, json={"symbol": "AMD", "messages": [{"role": "assistant", "text": "Hello"}]}).status_code == 422
        assert client.post(url, json={"symbol": "AMD", "messages": [{"role": "user", "text": "Latest news?"}]}).status_code == 503
