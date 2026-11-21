# SEA x OpenAI Codex Hackathon 2026

An intent-based AI financial companion for Thai investors, focused on goals, investing discipline, and informed decisions.

## Current status

The local demo includes Portfolio, Investing Behavior Score, Stock Detail, paper orders, and a research agent. Portfolio and quotes come from a synthetic MongoDB fixture. The Goals dashboard offers a local editor and Future World. Future Talk loads a MongoDB profile, goals, and portfolio snapshot, creates an older portrait from an optional selfie, and opens a conversation through OpenAI Realtime.

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
