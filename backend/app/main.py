from fastapi import FastAPI
from app.routers.control import router as control_router


def create_app() -> FastAPI:
    """Create the WebSocket relay application."""
    app = FastAPI(title="Paracosm WS Relay")
    app.include_router(control_router, prefix="/api")
    return app


app = create_app()
