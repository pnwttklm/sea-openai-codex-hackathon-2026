import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bson import ObjectId
from app.data.goal_plans import list_plans
from app.services.shared_portfolio import DemoFX, SharedPortfolio
from openai import AsyncOpenAI
from app.ai.companion_model import CompanionModel
from app.data.decision_journal import JournalRepository
from app.data.agent_traces import TraceStore
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

from app.api.router import router
from app.data.future_you import DEMO_PROFILE_ID, FutureYouRepository
from app.data.demo import DemoRepository
from app.data.research import ResearchRepository
from app.services.demo import DemoService
from app.services.paper import PaperService
from app.services.future_world import WorldLandmarks
from app.services.fx import FXUnavailable
from app.services.research import ResearchService


@asynccontextmanager
async def lifespan(application: FastAPI):
    uri = os.getenv("MONGODB_URI")
    application.state.demo = None
    application.state.paper = None
    application.state.research = None
    user_id = os.getenv("FUTURE_YOU_USER_ID")
    demo = not user_id and os.getenv("FUTURE_YOU_DEMO") == "1"
    application.state.future_you_user_id = DEMO_PROFILE_ID if demo else user_id
    application.state.future_you_is_demo = demo
    application.state.future_you_repository = None
    application.state.agent_traces = None
    application.state.operator_failures = []
    application.state.world_landmarks = WorldLandmarks()
    application.state.companion_model = CompanionModel()
    if not uri:
        yield
        return

    database = application.state.database_name or os.getenv("MONGODB_DATABASE", "prik_thai_dev")
    async with AsyncMongoClient(uri, serverSelectionTimeoutMS=3000, timeoutMS=5000) as client:
        application.state.future_you_repository = FutureYouRepository(client[database], demo=demo)
        repository = DemoRepository(client, database, shared_demo=demo)
        shared = SharedPortfolio(repository) if demo else None
        application.state.future_you_repository.shared_portfolio = shared

        async def health_goals():
            plans = await list_plans(application.state.future_you_repository.goals, ObjectId(DEMO_PROFILE_ID))
            return {p.id: p for p in plans}

        application.state.demo = DemoService(repository, shared, health_goals if demo else None)
        application.state.paper = PaperService(repository, DemoFX() if demo else None)
        application.state.research = ResearchService(ResearchRepository(client, database), application.state.demo)
        application.state.journal = JournalRepository(client[database])
        application.state.agent_traces = TraceStore(client[database])
        model = os.getenv("OPENAI_COMPANION_MODEL")
        if model and os.getenv("OPENAI_API_KEY"):
            async with AsyncOpenAI(timeout=7, max_retries=0) as ai:
                application.state.companion_model = CompanionModel(ai, model)
                yield
        else:
            yield


def create_app(*, database_name: str | None = None) -> FastAPI:
    application = FastAPI(title="Prik Thai API", version="0.1.0", lifespan=lifespan)
    application.state.database_name = database_name
    default_origins = "http://localhost:3000,http://127.0.0.1:3000"
    origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", default_origins).split(",") if origin.strip()]
    application.state.allowed_origins = origins
    application.add_middleware(
        CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"], expose_headers=["X-Future-Voice-Style"],
    )
    @application.exception_handler(PyMongoError)
    async def database_error(request: Request, error: PyMongoError) -> JSONResponse:
        return JSONResponse({"detail": "Demo database is temporarily unavailable"}, status_code=503)

    @application.exception_handler(FXUnavailable)
    async def fx_error(request: Request, error: FXUnavailable) -> JSONResponse:
        return JSONResponse({"detail": str(error)}, status_code=503)

    application.include_router(router, prefix="/api/v1")
    return application


app = create_app()
