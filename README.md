# SEA x OpenAI Codex Hackathon 2026

An intent-based AI financial companion for Thai investors, focused on goals, investing discipline, and informed decisions.

## Current status

Open Future Talk from the Goals dashboard to talk with an imagined older self using a saved profile, goals, and portfolio. See the [local demo setup](docs/development.md#future-you-demo) for MongoDB, Realtime voice, and portrait uploads.

## Run locally

Quick start with Docker from the repository root:

```sh
docker compose up --build
```

Open http://localhost:3000. See [Docker development guide](docs/development.md) for hot reload, logs, tests, and persistent MongoDB data.

See [Frontend setup](apps/web/README.md) and [Backend setup](apps/api/README.md). Frontend uses npm and its committed lockfile. Backend uses a virtual environment and `pyproject.toml`.

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
