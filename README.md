# SEA x OpenAI Codex Hackathon 2026

An intent-based AI financial companion for Thai investors, focused on goals, investing discipline, and informed decisions.

## Current status

The local demo includes Portfolio (line and allocation views), Financial Health Score Score, and Stock Detail. FastAPI reads a versioned synthetic fixture from MongoDB. Quotes and ratings in the demo API are synthetic. The demo includes local paper orders and a pre-sell reflection for NVDA with optional Webull headlines and OpenAI question selection. The shared agent demo adds an in-process FastMCP server and a private operator login.
Open Future Talk from the Goals dashboard to talk with an imagined older self using a saved profile, goals, and portfolio. See the [local demo setup](docs/development.md#future-you-demo) for MongoDB, Realtime voice, and portrait uploads.

For a fresh checkout with Nobita’s THB 500,000 portfolio, follow the [database and integration README](database/README.md). It includes the opening dataset, MongoDB restore commands, and the agent connection diagram.

## Run locally

Quick start with Docker from the repository root:

```sh
docker compose up --build
```

Open http://localhost:3000. See [Docker development guide](docs/development.md) for hot reload, logs, tests, and persistent MongoDB data.

See [Frontend setup](apps/web/README.md) and [Backend setup](apps/api/README.md). Frontend uses npm and its committed lockfile. Backend uses a virtual environment and `pyproject.toml`.

## Shared agent demo

In the root `.env` for this worktree set `FUTURE_YOU_DEMO=1`, leave `FUTURE_YOU_USER_ID` empty, set `WEB_PORT=3113` and `API_PORT=8113`, and set `AGENT_OPS_SECRET` to a locally generated secret of at least 24 characters. Leave `MONGODB_URI` unset to use the isolated Compose volume. For OpenAI routing and sentiment analysis, supply a server-side `OPENAI_API_KEY` and an accessible structured-output model in `OPENAI_COMPANION_MODEL`. With these unset the UI labels answers as an offline demo. News uses labeled synthetic samples by default. Set `COMPANION_NEWS_SOURCE=webull` and `WEBULL_MCP_ACCESS_TOKEN` for provider coverage.

```sh
docker compose -p prik-agent-foundation up --build -d
docker compose -p prik-agent-foundation exec -T api python -m app.data.seed_future_you_demo
```

Open [Investor Companion](http://localhost:3113/companion), [the stock greeting](http://localhost:3113/stocks/AMD), or the [operator dashboard](http://localhost:3113/ops/agents). Operator access uses the worktree's local secret. Goals, Future Talk, Portfolio, paper orders and the companion share the synthetic investor's saved data. [Agent contracts and account valuation](docs/contracts/agent-operations.md)

If this checkout uses `.env.local`, reload the running API with the command below after changing its key or model. This gives the file precedence over previously exported OpenAI settings.

```sh
env -u OPENAI_API_KEY -u OPENAI_COMPANION_MODEL docker compose --env-file .env.local up -d --no-deps api
```

From [Future You](http://localhost:3113/goals), add a goal and enter **Future World**. Talk to Doraemon at a landmark to see its funding progress or compare a monthly contribution. The town saves conversations and custom landmark appearances in MongoDB. If the model is unavailable, the conversation offers a retry and an offline demo. [Future World contract](docs/contracts/future-you.md#future-world-town-world-01)

## Stack and structure

| Path | Responsibility | Stack |
| --- | --- | --- |
| `apps/web/` | Responsive user interface | Next.js, TypeScript, App Router |
| `apps/api/` | REST routes, schemas, shared business services | FastAPI, Python |
| `apps/api/app/data/` | Persistence and database lifecycle | MongoDB |
| `apps/api/app/ai/` | AI orchestration and agent tools | OpenAI Python SDK, FastMCP |
| `docs/contracts/` | Cross-team interface decisions | Documented contracts |
| `docs/team/` | Roles, task ownership, handoffs | Team workflow |
| `resources/` | Product notes, design references, source index | Reference material |

## Start here

1. Read [AGENTS.md](AGENTS.md) and the [product context](resources/context/product-context.md).
2. Choose a role in the [team guide](docs/team/README.md).
3. Claim a task in the [task board](docs/team/tasks.md).
4. Read the `AGENTS.md` under your working directory and agree on shared contracts before coding.
5. Follow the app README for setup and record your checks when handing off work.

`AGENTS.md` is the canonical coding-agent instruction filename. Each teammate can open this repository in Codex and use their role prompt from the team guide.
