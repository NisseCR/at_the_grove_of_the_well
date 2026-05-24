from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from app.core.config import settings
from app.exceptions import ResourceIdNotFound
from app.services.scene_service import SceneService
from app.routers.scene import router as scene_router
from app.routers.control import router as control_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialise and tear down application resources.
    """
    # Create services.
    scene_service: SceneService = SceneService(settings.scene_data_dir)

    # Bind services to app state, so that they are accessible by endpoints throughout the app's lifespan.
    app.state.scene_service = scene_service

    yield


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.
    """
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # Setup middleware for front-end.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add exception handles.
    @app.exception_handler(ResourceIdNotFound)
    def not_found_handler(request: Request, exc: ResourceIdNotFound) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)}
        )

    # Include routers.
    app.include_router(scene_router)
    app.include_router(control_router)

    # Mount static files.
    app.mount(
        "/static/assets", StaticFiles(directory=settings.assets_dir), name="assets"
    )

    return app
