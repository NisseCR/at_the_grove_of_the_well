import type { TransportMessage } from "@/types/message";
import { WS_BASE } from "@/lib/config";
import { handleMessage } from "@/lib/services/messageHandler";
import { appState } from "@/stores/appState.svelte";

const WEBSOCKET_URL = `${WS_BASE}/api/control/ws`;
const RECONNECT_DELAY = 3000;

let websocket: WebSocket | null = null;

function connect(): void {
  // Don't open a new connection if one is already open or connecting
  if (
    websocket?.readyState === WebSocket.OPEN ||
    websocket?.readyState === WebSocket.CONNECTING
  )
    return;

  // Create new connection.
  websocket = new WebSocket(WEBSOCKET_URL);

  websocket.onopen = () => {
    appState.socketConnected = true;
    console.log("Socket connected.");
  };

  websocket.onclose = () => {
    appState.socketConnected = false;
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

export function sendSetScene(sceneId: string, label: string | null = null): void {
  send({ type: "SET_SCENE", payload: { sceneId, label } });
}

export function sendSetAmbiences(
  ambiences: { id: string; label: string | null; volume: number }[],
): void {
  send({ type: "SET_AMBIENCES", payload: { ambiences } });
}

export function sendSetAmbienceVolume(id: string, volume: number): void {
  send({ type: "SET_AMBIENCE_VOLUME", payload: { id, volume } });
}

export function sendSetPlaylist(id: string | null, label: string | null = null): void {
  send({ type: "SET_PLAYLIST", payload: { id, label } });
}

export function sendSetMusicVolume(volume: number): void {
  send({ type: "SET_MUSIC_VOLUME", payload: { volume } });
}

export function sendResetAudio(): void {
  send({ type: "RESET_AUDIO" });
}

export function sendSetDebug(debug: boolean): void {
  send({ type: "SET_DEBUG", payload: { debug } });
}

export function sendSync(): void {
  send({
    type: "SYNC",
    payload: {
      scene: appState.scene,
      ambiences: appState.ambiences,
      music: appState.music,
    },
  });
}
