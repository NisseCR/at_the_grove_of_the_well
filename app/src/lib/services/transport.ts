import type { TransportMessage } from "$lib/types/message";
import type { AmbienceWireEntry } from "$lib/types/state";
import { handleMessage } from "$lib/services/messageHandler";
import { appState } from "$lib/state/appState.svelte";

const RECONNECT_DELAY = 3000;

let websocket: WebSocket | null = null;

/**
 * Opens (or re-opens) the WebSocket connection to the relay.
 * Call from onMount — safe to call multiple times (no-op if already open).
 */
export function connect(): void {
  if (
    websocket?.readyState === WebSocket.OPEN ||
    websocket?.readyState === WebSocket.CONNECTING
  )
    return;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/api/control/ws`;
  websocket = new WebSocket(wsUrl);

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

export function send(msg: TransportMessage): void {
  if (websocket?.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(msg));
  }
}

export function sendSetScene(
  sceneId: string,
  label: string | null = null,
): void {
  send({ type: "SET_SCENE", payload: { sceneId, label } });
}

export function sendSetAmbiences(ambiences: AmbienceWireEntry[]): void {
  send({ type: "SET_AMBIENCES", payload: { ambiences } });
}

export function sendSetAmbienceVolume(id: string, volume: number): void {
  send({ type: "SET_AMBIENCE_VOLUME", payload: { id, volume } });
}

export function sendSetPlaylist(
  id: string | null,
  label: string | null = null,
): void {
  send({
    type: "SET_PLAYLIST",
    payload: { id, label, volume: appState.music.targetGain },
  });
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
  const { ambiences, music } = appState;
  send({
    type: "SYNC",
    payload: {
      scene: appState.scene,
      ambiences: ambiences.activeIds.map((id) => ({
        id,
        label: ambiences.labels[id] ?? null,
        volume: ambiences.targetGains[id],
      })),
      music: music.activeId
        ? { id: music.activeId, label: music.label, volume: music.targetGain }
        : null,
    },
  });
}
