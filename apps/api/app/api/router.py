from fastapi import APIRouter
from app.api.routes.demo import router as demo_router
from app.api.routes.health import router as health_router

router = APIRouter()
router.include_router(health_router)
router.include_router(demo_router)
