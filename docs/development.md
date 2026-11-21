# Local development with Docker

Install and start Docker Desktop (or Docker Engine with Compose). From the repository root:

```sh
docker compose up --build
```

| Service | Address |
| --- | --- |
| Next.js | http://localhost:3000 |
| FastAPI documentation | http://localhost:8000/docs |
| API liveness | http://localhost:8000/api/v1/health |
| MongoDB | `mongodb://mongo:27017` inside Compose only |

No env file is required for this starter. Frontend and backend ports bind to localhost. MongoDB has no host port and no authentication in this local-only setup. Its data persists in the Compose-managed `mongo_data` volume. The backend receives the database URI, but the application does not connect to it yet. OpenAI and FastMCP are not configured.

For parallel work on one machine, see [Working in parallel](team/parallel-work.md). Use a distinct `-p` project name and `WEB_PORT`/`API_PORT` values for each checkout; Compose derives separate networks and database volumes per project.

## Daily workflow

Source changes under frontend `src/` and backend `app/` reload automatically. Frontend public assets and backend tests are mounted too. Dependencies live inside images, separate from host installations.

```sh
docker compose up -d --build
docker compose logs -f web api
docker compose exec api pytest
docker compose exec web npm run typecheck
docker compose exec mongo mongosh prik_thai_dev
docker compose down
```

Run frontend production builds in a separate temporary container so the dev server's `.next` output is not overwritten:

```sh
docker compose run --rm --no-deps web npm run build
```

After changing dependency manifests or lockfiles, rebuild the affected service. Frontend dependency changes should update and commit `package-lock.json`. Backend dependencies are currently version ranges in `pyproject.toml`; selecting a Python lockfile workflow remains a follow-up task.

`docker compose down` preserves database data. Do not remove volumes or clear the shared database unless a reset is explicitly intended. This Compose file and the `Dockerfile.dev` images are for local development, not production deployment.

Health checks order MongoDB, API, and frontend startup. API health reports process liveness only. Database or AI readiness must be implemented separately when those integrations land.
