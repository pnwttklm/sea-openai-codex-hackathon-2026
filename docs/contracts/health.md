# Health contract

Status: implemented starter contract. Owner: Backend/API. Consumers: local developers and process monitors.

`GET /api/v1/health` has no input or authentication. It returns HTTP 200 with JSON `{"status":"ok"}`. The Pydantic response schema is `app/schemas/health.py`.

This is process liveness only, not database, MCP, or OpenAI readiness. It makes no external calls and reads no user data. Unknown routes return FastAPI's standard HTTP 404 response. The default local frontend origin is `http://localhost:3000`; override through process environment `CORS_ORIGINS`.
