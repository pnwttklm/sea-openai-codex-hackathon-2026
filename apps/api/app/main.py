import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient

from app.api.router import router
from app.data.future_you import DEMO_PROFILE_ID, FutureYouRepository


@asynccontextmanager
async def lifespan(application: FastAPI):
    uri = os.getenv("MONGODB_URI")
    user_id = os.getenv("FUTURE_YOU_USER_ID")
    demo = not user_id and os.getenv("FUTURE_YOU_DEMO") == "1"
    application.state.future_you_user_id = DEMO_PROFILE_ID if demo else user_id
    application.state.future_you_is_demo = demo
    application.state.future_you_repository = None
    if not uri:
        yield
        return

    async with AsyncMongoClient(uri, serverSelectionTimeoutMS=3000, timeoutMS=5000) as mongo:
        database = mongo[os.getenv("MONGODB_DATABASE", "prik_thai_dev")]
        application.state.future_you_repository = FutureYouRepository(database, demo=demo)
        yield


def create_app() -> FastAPI:
    application = FastAPI(title="Prik Thai API", version="0.1.0", lifespan=lifespan)
    default_origins = "http://localhost:3000,http://127.0.0.1:3000"
    origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", default_origins).split(",") if origin.strip()]
    application.state.allowed_origins = origins
    application.add_middleware(
        CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"], expose_headers=["X-Future-Voice-Style"],
    )
    application.include_router(router, prefix="/api/v1")
    return application


app = create_app()
