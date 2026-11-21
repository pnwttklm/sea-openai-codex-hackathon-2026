# Backend

Python 3.11 or later. From this directory:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

REST liveness: `GET http://localhost:8000/api/v1/health`. API docs: http://localhost:8000/docs.

Run `pytest` after installing dev dependencies. Set `CORS_ORIGINS` as a comma-separated process environment variable. The API does not automatically load `.env` files.

`app/api/routes/`: REST handlers. `app/schemas/`: Pydantic contracts. `app/services/`: business logic shared by REST and MCP. `app/core/`: settings and shared infrastructure. `app/data/`: MongoDB. `app/ai/`: OpenAI and FastMCP.

The local API includes health, saved Future You context, GPT Image portrait upload, and opt-in Realtime voice. See the [Future You contract](../../docs/contracts/future-you.md) and [local demo setup](../../docs/development.md). FastMCP, authentication, and a Python lockfile remain follow-up work.
