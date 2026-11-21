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

No env file is required for the starter. Frontend and backend ports bind to localhost. MongoDB has no host port or authentication in this local setup. Its data persists in the `mongo_data` volume.

## Future You demo

Set `FUTURE_YOU_DEMO=1` in the repository root `.env`. For live voice set `FUTURE_YOU_VOICE_ENABLED=1`. For selfie uploads set `FUTURE_YOU_MEDIA_ENABLED=1`. Both OpenAI features use the server-side `OPENAI_API_KEY`. `OPENAI_REALTIME_MODEL` and `OPENAI_IMAGE_MODEL` can override the defaults.

```sh
docker compose up -d --build --wait
docker compose exec -T api python -m app.data.seed_future_you_demo
```

Open **Future Talk** on `/goals`, or visit `/future-you` directly. In shared demo mode, the Goals dashboard and Future World read and save plans through FastAPI and MongoDB. The standalone browser demo uses local storage. Future Talk reads its saved profile and goals from MongoDB. The demo uses a synthetic profile, goal, and portfolio snapshot from `future_you_demo`. Run the seed command again to add any missing demo data. Use **Start live conversation** to grant microphone access. **Use my photo** replaces the sample portrait for that visit and automatically suggests a voice style for the new portrait. Set `OPENAI_PORTRAIT_VISION_MODEL` to override the vision model. The local API tests mock OpenAI and run without a key. The [API contract](contracts/future-you.md) describes the portfolio fields, portrait upload, and WebRTC offer endpoints.

To use existing data, set `FUTURE_YOU_USER_ID` to the saved profile's MongoDB ObjectId. This takes precedence over demo mode. Compose can also receive `MONGODB_URI` and `MONGODB_DATABASE` for an existing development database. The local API reads the saved profile and its goals without modifying them.

For parallel work on one machine, see [Working in parallel](team/parallel-work.md). Use a distinct `-p` project name and `WEB_PORT`/`API_PORT` values for each checkout; Compose derives separate networks and database volumes per project.

The portrait endpoint uses GPT Image. The earlier silent-video API also requires a model with GIF preview access and FFmpeg with H.264 support. Docker includes FFmpeg.

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
