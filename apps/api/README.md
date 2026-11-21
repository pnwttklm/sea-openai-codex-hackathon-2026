# Backend

Python 3.11 or later. From this directory:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
uvicorn app.main:app --reload --port 8000
```

REST liveness: `GET http://localhost:8000/api/v1/health`. API docs: http://localhost:8000/docs.

Run `pytest` after installing dev dependencies. `CORS_ORIGINS` is a comma-separated process environment variable; `.env` files are not automatically loaded. Allowed browser methods cover demo reads and paper order submissions.

`app/api/routes/`: REST handlers. `app/schemas/`: Pydantic contracts. `app/services/`: business logic shared by REST and MCP. `app/core/`: settings and shared infrastructure. `app/data/`: MongoDB. `app/ai/`: OpenAI and FastMCP.

Set `MONGODB_URI` and optionally `MONGODB_DATABASE` (defaults to `prik_thai_dev`) to enable the read-only demo routes. Docker Compose supplies both settings. The API inserts a versioned synthetic snapshot into `demo_snapshots` on the first successful demo request. See the [demo contract](../../docs/contracts/demo.md). Authentication and a Python lockfile remain follow-up tasks.

The local paper account starts with the THB equivalent of USD 10,000 and 10 shares of each demo symbol. Existing demo cash converts once using the latest Frankfurter USD/THB reference rate. Each new order records its own rate and settles in THB. Confirmed paper fills persist in MongoDB and update that account. They use fixture USD prices and do not touch a brokerage account. This shared demo account is intended for localhost.

To enable live headlines, give the API a valid Webull Cloud MCP OAuth access token with Non-Trading authorization in `WEBULL_MCP_ACCESS_TOKEN`. The adapter only calls `get_stock_news`. It does not obtain or refresh a token. Optionally set `OPENAI_API_KEY` and `OPENAI_REFLECTION_MODEL` to let the model select a neutral question from approved options based on public headlines. Compose reads these optional values from the repository root environment or ignored root `.env` file. Restart the API after changing them. Without a token, the reflection still works and shows that news is unavailable.

For free-text research chat, set `OPENAI_API_KEY` and `OPENAI_REFLECTION_MODEL` to a Responses API model that supports function calling and web search. The agent can request Webull MCP stock news when its token is configured. OpenAI web search is available as a fallback and citations appear in the chat panel. Webull receives the ticker only. Chat is read-only and served by the local demo API.
Run `pytest` after installing dev dependencies. Set `CORS_ORIGINS` as a comma-separated process environment variable. The API does not automatically load `.env` files.

`app/api/routes/`: REST handlers. `app/schemas/`: Pydantic contracts. `app/services/`: business logic shared by REST and MCP. `app/core/`: settings and shared infrastructure. `app/data/`: MongoDB. `app/ai/`: OpenAI and FastMCP.

The local API includes health, saved Future You context, GPT Image portrait upload, and opt-in Realtime voice. See the [Future You contract](../../docs/contracts/future-you.md) and [local demo setup](../../docs/development.md). FastMCP, authentication, and a Python lockfile remain follow-up work.
