import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter(prefix="/control")

connected: set[WebSocket] = set()


class BroadcastRequest(BaseModel):
    messages: list[dict[str, Any]]


@router.post("/broadcast")
async def broadcast(request: BroadcastRequest):
    for message in request.messages:
        text = json.dumps(message)
        for client in set(connected):
            try:
                await client.send_text(text)
            except Exception:
                connected.discard(client)
    return {"ok": True}


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
