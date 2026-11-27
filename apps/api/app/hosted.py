"""Vercel entry point for the shared synthetic investor."""
import os
import re

from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.main import create_app


app = create_app(database_name="prik_thai_public")


@app.middleware("http")
async def demo_access(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        hosts = (os.getenv("VERCEL_PROJECT_PRODUCTION_URL"), os.getenv("VERCEL_URL"))
        if request.headers.get("origin") not in {f"https://{host}" for host in hosts if host}:
            return JSONResponse({"detail": "Open the demo site to make changes."}, status_code=403)

    request.state.hosted_demo_access = True
    response = await call_next(request)
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Demo-Access"] = "public"
    return response


@app.get("/api/v1/access", include_in_schema=False)
async def legacy_access(return_to: str = "/"):
    destination = return_to if re.fullmatch(
        r"/(?:future-you|companion|behavior|goals|future-world(?:/town)?|stocks/[A-Z]{1,5})", return_to
    ) else "/"
    return RedirectResponse(destination, status_code=303)
