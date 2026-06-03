from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from app.core.config import settings
from app.exceptions import ResourceIdNotFound, ResourceIdConflict
from app.services.scene_service import SceneService
from app.services.ambience_service import AmbienceService
from app.services.image_service import ImageService
from app.services.music_service import MusicService
from app.routers.scene import router as scene_router
from app.routers.ambience import router as ambience_router
from app.routers.image import router as image_router
from app.routers.control import router as control_router
from app.routers.music import router as music_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialise and tear down application resources.
    """
    # Create services.
    scene_service: SceneService = SceneService(settings.scene_data_dir, settings.scene_categories_dir)
    ambience_service: AmbienceService = AmbienceService(settings.ambience_data_dir, settings.ambience_categories_dir, settings.ambience_audio_dir)

    # Bind services to app state, so that they are accessible by endpoints throughout the app's lifespan.
    app.state.scene_service = scene_service
    app.state.ambience_service = ambience_service
    app.state.image_service = ImageService(settings.image_assets_dir)
    app.state.music_service = MusicService(settings.music_data_dir, settings.music_categories_dir)

    yield


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.
    """
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # Setup middleware for front-end.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add exception handles.
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

    # Include routers.
    app.include_router(scene_router)
    app.include_router(ambience_router)
    app.include_router(image_router)
    app.include_router(control_router)
    app.include_router(music_router)

    # Mount static files.
    app.mount(
        "/static/assets", StaticFiles(directory=settings.assets_dir), name="assets"
    )

    return app


app = create_app()
