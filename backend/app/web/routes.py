from fastapi import APIRouter, WebSocket
from fastapi.responses import PlainTextResponse, JSONResponse

from app.core.config import settings

router = APIRouter()


@router.get("/ping", response_class=JSONResponse)
def ping():
    """Placeholder endpoint — does nothing for now."""
    return {"status": settings}


connected: set[WebSocket] = set()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Provide websocket connection."""
    await ws.accept()
    connected.add(ws)
    try:
        while True:
            msg = await ws.receive_text()
            # broadcast to all other connected clients
            for client in connected - {ws}:
                await client.send_text(msg)
    except:
        connected.remove(ws)
