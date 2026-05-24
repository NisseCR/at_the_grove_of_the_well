from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers.scene import router as scene_router
from app.routers.control import router as control_router


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.

    Returns:
        A fully configured FastAPI application.
    """
    app = FastAPI(title=settings.app_name)

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
