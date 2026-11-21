# Team guide

These are four proposed work areas for the four-person team. Assign people in the task board; no personal assignments are assumed.

Follow [Working in parallel](parallel-work.md) for separate Codex sessions, file ownership, isolated worktrees, and independent Docker stacks.

## Ownership

| Role | Primary area | First initialization task | Coordinate with |
| --- | --- | --- | --- |
| Frontend | `apps/web/` | Scaffold Next.js and a responsive shell | Backend for API shapes; team for Figma |
| Backend/API | `apps/api/` except Data and AI subdirectories | Scaffold FastAPI, settings, schemas, health route | All roles for service interfaces |
| Data | `apps/api/app/data/` | Define MongoDB repository interfaces and lifecycle | Backend for schemas; AI for tool data needs |
| AI/MCP | `apps/api/app/ai/` | Scaffold OpenAI service and FastMCP entry point | Backend for shared services; Data for access boundaries |

The Backend owner coordinates API dependency manifests and application startup. Frontend owns its dependency manifest and lockfile. Data and AI owners request their Python dependencies through Backend so teammates do not edit the same manifest concurrently. These are coordination roles, not permanently assigned people.

## Working sequence

1. Agree on one MVP journey using the resource notes and design reference. Candidate features are not commitments.
2. Claim a bounded task with an owner, branch, and paths in `tasks.md`.
3. Record routes, schemas, repository interfaces, and tool contracts before dependent implementation.
4. Backend creates the Python package structure and configuration first. Data and AI then add their modules; Frontend can develop against explicit contract fixtures meanwhile.
5. Merge small changes with check results and a clear handoff. Integrate a single end-to-end journey before broadening the feature set.

Shared root files, contracts, and this board require coordinated edits. On separate clones, use branches and PRs. In a shared checkout, claim files and avoid simultaneous Git operations; a branch switch affects everyone in that checkout.

## Prompts for each teammate

Use one prompt below in Codex, replacing the task ID with a claimed task. Each prompt authorizes implementation of that task, not arbitrary scope expansion.

### Frontend

> Act as the Frontend owner. Read root AGENTS.md, apps/web/AGENTS.md, resources/README.md, and docs/contracts/README.md. Work on claimed task WEB-01 in docs/team/tasks.md. Build the Next.js mobile-first UI within the agreed scope. Use documented API contracts, identify mock data clearly, and report checks and integration needs.

### Backend/API

> Act as the Backend/API owner. Read root AGENTS.md, apps/api/AGENTS.md, and docs/contracts/README.md. Work on claimed task API-01 in docs/team/tasks.md. Coordinate the Python manifest, configuration, and startup with Data and AI owners. Keep REST handlers thin, define shared schemas and services, and report checks and handoff requirements.

### Data

> Act as the Data owner. Read root AGENTS.md, apps/api/AGENTS.md, apps/api/app/data/AGENTS.md, and docs/contracts/README.md. Work on claimed task DATA-01 in docs/team/tasks.md. Agree on repository interfaces with Backend before implementing MongoDB access. Keep secrets out of source and report lifecycle, indexes, and validation results.

### AI/MCP

> Act as the AI/MCP owner. Read root AGENTS.md, apps/api/AGENTS.md, apps/api/app/ai/AGENTS.md, and docs/contracts/README.md. Work on claimed task AI-01 in docs/team/tasks.md. Build server-side OpenAI and FastMCP integration through shared application services. Coordinate dependency and startup changes with Backend, and report mocked versus live verification.

## Handoff template

Include task ID, changed behavior, files touched, contract changes, commands run and results, remaining blockers, and the next integration step. Never include secrets or private user data in handoff examples.
