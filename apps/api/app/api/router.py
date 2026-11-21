from fastapi import APIRouter
from app.api.routes.companion import router as companion_router
from app.api.routes.demo import router as demo_router
from app.api.routes.future_you import router as future_you_router
from app.api.routes.future_world import router as future_world_router
from app.api.routes.health import router as health_router

router = APIRouter()
router.include_router(health_router)
router.include_router(demo_router)
router.include_router(future_you_router)

router.include_router(companion_router)
router.include_router(future_world_router)
