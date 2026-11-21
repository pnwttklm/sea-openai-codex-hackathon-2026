import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

from app.api.router import router
from app.data.demo import DemoRepository
from app.data.research import ResearchRepository
from app.services.demo import DemoService
from app.services.paper import PaperService
from app.services.research import ResearchService


@asynccontextmanager
async def lifespan(application: FastAPI):
    uri = os.getenv("MONGODB_URI")
    application.state.demo = None
    application.state.paper = None
    application.state.research = None
    if not uri:
        yield
        return

    database = os.getenv("MONGODB_DATABASE", "prik_thai_dev")
    async with AsyncMongoClient(uri, timeoutMS=3000) as client:
        repository = DemoRepository(client, database)
        application.state.demo = DemoService(repository)
        application.state.paper = PaperService(repository)
        application.state.research = ResearchService(ResearchRepository(client, database))
        yield


def create_app() -> FastAPI:
    application = FastAPI(title="Prik Thai API", version="0.1.0", lifespan=lifespan)
    origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    application.add_middleware(
        CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
    )

    @application.exception_handler(PyMongoError)
    async def database_error(request: Request, error: PyMongoError) -> JSONResponse:
        return JSONResponse({"detail": "Demo database is temporarily unavailable"}, status_code=503)

    application.include_router(router, prefix="/api/v1")
    return application


app = create_app()
