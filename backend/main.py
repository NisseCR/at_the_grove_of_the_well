from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    """Placeholder endpoint — does nothing for now."""
    return {"status": "tss"}


connected: set[WebSocket] = set()


@app.websocket("/ws")
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
