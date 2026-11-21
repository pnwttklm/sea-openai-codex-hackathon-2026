# Backend/API instructions

Applies to `apps/api/`, alongside root instructions. Data and AI subdirectories carry additional instructions.

- Backend owns the FastAPI entry point, settings, Pydantic schemas, REST routes, shared services, Python manifest, and lockfile.
- Establish an importable Python package under `app/` when scaffolding; do not assume existing runtime files.
- Keep settings explicit, environment-driven, and validated. `.env.example` contains placeholders only.
- Keep REST handlers thin. Shared business services must be usable by both REST and MCP entry points.
- Coordinate startup and shutdown with Data and AI owners. Avoid network calls during module import.
- Agree on response and error schemas in `docs/contracts/` before clients depend on them.
- Validate inputs and enforce authorization at the service boundary, including calls originating from tools.
- Coordinate Python dependency additions for Data and AI; avoid competing manifests and lockfiles.
- Test validation, service behavior, meaningful error paths, and health behavior. Keep live external-service tests opt-in and documented.
