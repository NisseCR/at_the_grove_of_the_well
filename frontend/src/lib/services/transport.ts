import type { TransportMessage } from "@/types/message";
import { SERVER } from "@/lib/config";
import { handleMessage } from "@/lib/services/messageHandler";

const WEBSOCKET_URL = `ws://${SERVER}/ws`;
const RECONNECT_DELAY = 3000;

let websocket: WebSocket | null = null;

function connect(): void {
  websocket = new WebSocket(WEBSOCKET_URL);

  websocket.onopen = () => {
    console.log("Socket connected.");
  };

  websocket.onclose = () => {
    console.log("Socket disconnected, reconnecting...");
    setTimeout(connect, RECONNECT_DELAY);
  };

  websocket.onerror = () => websocket?.close();

  websocket.onmessage = async (event: MessageEvent) => {
    const message: TransportMessage = JSON.parse(event.data);
    await handleMessage(message);
  };
}

connect();

export function send(msg: TransportMessage): void {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(msg));
  }
}

export function sendSetScene(sceneId: string): void {
  send({ type: "SET_SCENE", payload: { sceneId } });
}

export function sendSync(): void {
  send({ type: "SYNC" });
}
