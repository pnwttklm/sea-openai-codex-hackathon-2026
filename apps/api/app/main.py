import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router


def create_app() -> FastAPI:
    application = FastAPI(title="Prik Thai API", version="0.1.0")
    origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
    application.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET"], allow_headers=["Content-Type"])
    application.include_router(router, prefix="/api/v1")
    return application


app = create_app()
