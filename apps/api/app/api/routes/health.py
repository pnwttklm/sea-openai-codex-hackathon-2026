from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Process liveness only; does not assert database or AI readiness."""
    return HealthResponse(status="ok")
