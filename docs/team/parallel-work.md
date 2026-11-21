# Working in parallel

All four roles can work at the same time. Use separate clones or worktrees, separate branches, and bounded file ownership. A shared working directory does not isolate Git branches or uncommitted edits.

## Before splitting work

Start from the committed, shared initialization baseline. A new clone or worktree will not contain uncommitted files; commit and share any additional setup changes before other teammates depend on them. Do not start four worktrees from an empty repository.

After a shared baseline commit exists, use one clone per person, or create worktrees in an approved location. Example from the shared checkout, using subdirectories ignored by Git:

```sh
git worktree add .worktrees/frontend -b feat/frontend-shell
git worktree add .worktrees/backend -b feat/backend-services
git worktree add .worktrees/data -b feat/data-repositories
git worktree add .worktrees/ai -b feat/ai-tools
```

Open the appropriate directory in a separate Codex session. Dependencies are installed independently per worktree. Integrate changes through reviewed commits/PRs; do not copy entire directories over another branch.

## File boundaries

| Role | Can independently edit | Coordinate before editing |
| --- | --- | --- |
| Frontend | `apps/web/src/`, `apps/web/public/`, frontend tests | Frontend manifest/lockfile if another UI task is active; API contracts |
| Backend/API | `apps/api/app/api/`, `schemas/`, `services/`, `core/`, backend route/service tests | `main.py`, Python manifest, shared interfaces |
| Data | `apps/api/app/data/`, `apps/api/tests/data/` | Startup, Python dependencies, shared domain schemas |
| AI/MCP | `apps/api/app/ai/`, `apps/api/tests/ai/` | Startup, Python dependencies, shared service/tool contracts |

Backend coordinates `main.py` and Python dependencies. Assign one integration owner per iteration for root documentation, Docker files, task-board reconciliation, and cross-area contract changes. Do not let multiple agents regenerate lockfiles or refactor shared startup concurrently.

## Starting without waiting on each other

- Frontend can build layout, reusable controls, and explicit synthetic fixtures while contracts are being reviewed.
- Backend can implement configuration, health, schema validation, and shared service interfaces without MongoDB or live AI.
- Data can implement connection lifecycle and test infrastructure independently; feature repositories wait for agreed schemas.
- AI/MCP can implement provider adapters, output validation, and mock-backed tests independently; tool names and service wiring wait for agreed contracts.

Once the first journey is selected, record input/output examples and error cases in `docs/contracts/`. Each consumer builds against the same contract; mocks must match it. If a dependency is blocked, continue the independent tasks above rather than inventing an incompatible interface.

## Multiple stacks on one machine

Each worktree needs a unique Compose project name and host ports. This also isolates its MongoDB volume and network. Run from each worktree root:

```sh
# Frontend worktree
WEB_PORT=3101 API_PORT=8101 docker compose -p prik-frontend up --build -d
# Backend worktree
WEB_PORT=3102 API_PORT=8102 docker compose -p prik-backend up --build -d
# Data worktree
WEB_PORT=3103 API_PORT=8103 docker compose -p prik-data up --build -d
# AI worktree
WEB_PORT=3104 API_PORT=8104 docker compose -p prik-ai up --build -d
```

Use the same project name for subsequent commands, for example `docker compose -p prik-data exec api pytest` and `docker compose -p prik-data down`. Repeat the same port variables for commands that recreate containers. People on separate machines can use the default ports.

## Handoff and integration

Claim a task with exact paths, implement it on your branch, run relevant checks, and report contract changes and blockers. Avoid committing unrelated formatting. The integration owner brings reviewed changes into the shared branch in dependency order, runs the complete checks, and verifies one end-to-end flow. Use task-board changes in small commits; resolve overlapping board entries by preserving everyone's status.
