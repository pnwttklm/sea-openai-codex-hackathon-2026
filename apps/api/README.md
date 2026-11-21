# Backend

Python 3.11 or later. From this directory:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

REST liveness: `GET http://localhost:8000/api/v1/health`. API docs: http://localhost:8000/docs.

Run `pytest` after installing dev dependencies. `CORS_ORIGINS` is a comma-separated process environment variable; `.env` files are not automatically loaded. Allowed browser methods currently cover only the health route.

`app/api/routes/`: REST handlers. `app/schemas/`: Pydantic contracts. `app/services/`: business logic shared by REST and MCP. `app/core/`: settings and shared infrastructure. `app/data/`: MongoDB. `app/ai/`: OpenAI and FastMCP.

Only the health route is implemented. Database, AI, authentication, product routes, and a Python lockfile remain follow-up tasks. The service is for local development; it is not deployment-ready.
