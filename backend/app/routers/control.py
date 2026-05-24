import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/control")

connected: set[WebSocket] = set()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Add connection.
    await websocket.accept()
    connected.add(websocket)

    # Notify all current clients that someone joined.
    for client in connected - {websocket}:
        await client.send_text(json.dumps({"type": "CLIENT_CONNECTED"}))

    # Propogate incoming messages to other clients.
    try:
        while True:
            message = await websocket.receive_text()
            for client in connected:  # - {websocket}:
                await client.send_text(message)

    except WebSocketDisconnect:
        connected.discard(websocket)
