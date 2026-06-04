import secrets
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.exceptions import ResourceIdNotFound, ResourceIdConflict
from app.routers.assets import router as assets_router
from app.routers.scene import router as scene_router
from app.routers.ambience import router as ambience_router
from app.routers.control import router as control_router
from app.routers.music import router as music_router
from app.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialise and tear down application resources.
    """
    create_db_and_tables()
    app.state.auth_token = secrets.token_urlsafe(32)
    app.state.auth_token_password = settings.controller_password

    yield


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.
    """
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ResourceIdNotFound)
    def not_found_handler(request: Request, exc: ResourceIdNotFound) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)}
        )

    @app.exception_handler(ResourceIdConflict)
    def conflict_handler(request: Request, exc: ResourceIdConflict) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)}
        )

    app.include_router(auth_router, prefix="/api")
    app.include_router(assets_router, prefix="/api")
    app.include_router(scene_router, prefix="/api")
    app.include_router(ambience_router, prefix="/api")
    app.include_router(control_router, prefix="/api")
    app.include_router(music_router, prefix="/api")

    return app


app = create_app()
