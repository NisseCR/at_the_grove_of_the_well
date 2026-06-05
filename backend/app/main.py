import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import state
from app.core.config import settings
from app.routers.admin import router as admin_router
from app.routers.ambience import router as ambience_router
from app.routers.auth import router as auth_router
from app.routers.control import router as control_router
from app.routers.music import router as music_router
from app.routers.scene import router as scene_router
from app.services.scanner import scan

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise auth token and run the initial R2 scan."""
    app.state.auth_token = secrets.token_urlsafe(32)
    app.state.auth_token_password = settings.controller_password

    try:
        state.data = scan(settings.scenes_dir)
    except Exception as exc:
        logger.error("Initial R2 scan failed: %s", exc)

    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api")
    app.include_router(ambience_router, prefix="/api")
    app.include_router(scene_router, prefix="/api")
    app.include_router(music_router, prefix="/api")
    app.include_router(control_router, prefix="/api")
    app.include_router(admin_router, prefix="/api")

    return app


app = create_app()
