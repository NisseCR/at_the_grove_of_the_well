from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from app.core.config import settings
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

    # Bind to app state.
    app.state.scene_service = scene_service

    yield


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.
    """
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(scene_router)
    app.include_router(control_router)

    app.mount(
        "/static/assets", StaticFiles(directory=settings.assets_dir), name="assets"
    )
    return app
