# Project instructions

## Goal

Build a mobile-responsive web application for the SEA x OpenAI Codex Hackathon 2026.

## Project context and resources

Read [resources/README.md](resources/README.md) and [resources/context/product-context.md](resources/context/product-context.md) before planning or implementing features. They index the user-supplied Google Drive context, financial model, and image assets. The product concept is an intent-based AI financial companion for Thai investors, focused on goals, discipline, and informed decisions. Candidate features remain subject to MVP selection.

Design and brainstorm reference:
https://www.figma.com/design/fxGXlNob258j5CekcAFxIH/SEA-x-OpenAI-Codex-Hackathon-2026-Brainstorm?node-id=0-1

The reference has not yet been inspected. Read it through an available Figma integration or browser before implementing product-specific screens. If access is unavailable, request an export or the relevant requirements. Do not assume product features from the file title.

## Required architecture

- Frontend: Next.js with TypeScript and the App Router.
- Backend: Python with FastAPI.
- Database: MongoDB, accessed through the backend.
- Agent tools: FastMCP, sharing application services with the REST API.
- AI integration: the official OpenAI Python SDK, called on the server.

Repository layout:

```text
apps/web/                   Next.js frontend
apps/api/                   FastAPI backend
apps/api/app/data/          MongoDB repositories and database lifecycle
apps/api/app/ai/            OpenAI integration and FastMCP entry point
docs/team/                 Team roles, collaboration, and task tracking
docs/contracts/            Shared API and tool contracts
resources/                 Product context and source references
```

The starter includes Next.js pages and a FastAPI health route. See each application's README for commands. MongoDB, OpenAI, FastMCP, and product behavior remain to be implemented.

## Team and coding agent workflow

- Read this file, `docs/team/README.md`, and the `AGENTS.md` in the area you will edit. Parent instructions apply alongside more specific directory instructions.
- Four proposed roles are Frontend, Backend/API, Data, and AI/MCP. People may take multiple roles; assignments are not yet named.
- Claim a task in `docs/team/tasks.md` before editing. Use a branch such as `feat/frontend-goals` or `feat/data-profile`.
- For concurrent work, follow `docs/team/parallel-work.md`: use independent clones/worktrees and Compose project names/ports. Do not switch branches in a checkout another agent is editing. The initialization must be committed and shared before branching from it.
- Follow `docs/contracts/README.md` before changing an interface used by another role. Do not guess response shapes or silently alter a shared contract.
- Keep work within your claimed area. Coordinate shared-file edits and preserve teammates' uncommitted changes.
- Never reset, clean, overwrite, or discard another teammate's work to resolve a conflict.
- Implement bounded tasks through validation and handoff; document blockers and mocks explicitly.
- Only document commands that exist and report which were actually checked. Starter feature pages must remain clearly labeled until implemented.

## Implementation conventions

- Keep route handlers thin; put business logic in services shared by REST and MCP tools.
- Define request and response schemas with Pydantic; keep frontend API types aligned with them.
- Use async backend I/O and a supported async MongoDB driver. Manage client startup and shutdown explicitly.
- Validate external input and return useful, consistent API errors.
- Keep MongoDB credentials and OpenAI API keys server-side. Never put secrets in `NEXT_PUBLIC_*` variables, source control, logs, or client bundles.
- Document configuration in `.env.example` using placeholders; ignore real environment files.
- Make the OpenAI model configurable. Do not invent SDK methods or hard-code assumptions about current model availability.
- Configure allowed frontend origins explicitly for local development and deployment.
- Add authentication and authorization before exposing user data or mutating tools publicly. Do not publish or deploy as part of repository initialization.
- Use environment-appropriate dependency versions and commit the chosen package manager's lockfile when scaffolding.

## Responsive UI

- Start with mobile layouts and progressively enhance for tablet and desktop.
- Avoid horizontal overflow and fixed widths that break small screens.
- Use semantic HTML, visible focus states, labeled controls, readable text, and accessible contrast.
- Provide loading, empty, error, and success states for data-driven interactions.
- Follow the Figma reference once inspected; distinguish temporary placeholders from confirmed design decisions.

## Verification and handoff

- Add setup and run commands to `README.md` when the corresponding services exist.
- Run checks appropriate to each change, including frontend type checking and production builds when available.
- Test meaningful backend behavior, validation, failure paths, and shared MCP service behavior.
- Check key screens at mobile and desktop sizes when browser verification is available.
- Report what was implemented, what was verified, and any remaining setup or access requirements. Never claim a check passed if it was not run.
