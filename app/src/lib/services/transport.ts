import type {
  TransportMessage,
  SceneWireEntry,
  HandoutWireEntry,
  AmbienceWireEntry,
  PlaylistWriteEntry,
} from "$lib/types/message";
import type { AmbienceId, VolumeGain } from "$lib/types/state";
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

export function sendSetScene(scene: SceneWireEntry): void {
  send({ type: "SET_SCENE", payload: scene });
}

export function sendSetHandout(handout: HandoutWireEntry | null): void {
  send({ type: "SET_HANDOUT", payload: handout });
}

export function sendSetAmbiences(ambiences: AmbienceWireEntry[]): void {
  send({ type: "SET_AMBIENCES", payload: ambiences });
}

export function sendSetAmbienceVolume(
  id: AmbienceId,
  volume: VolumeGain,
): void {
  send({ type: "SET_AMBIENCE_VOLUME", payload: { id, volume } });
}

export function sendSetPlaylist(playlist: PlaylistWriteEntry): void {
  send({ type: "SET_PLAYLIST", payload: playlist });
}

export function sendSetPlaylistVolume(volume: VolumeGain): void {
  send({ type: "SET_PLAYLIST_VOLUME", payload: { volume } });
}

export function sendResetAudio(): void {
  send({ type: "RESET_AUDIO" });
}

export function sendSetDebug(debug: boolean): void {
  send({ type: "SET_DEBUG", payload: { debug } });
}

export function sendSync(): void {
  const { scene, handout, ambiences, playlists } = appState;

  const ambienceEntries: AmbienceWireEntry[] = ambiences.ids.map((id) => ({
    id,
    label: ambiences.labels[id] ?? null,
    targetGain: ambiences.targetGains[id],
    volumeGain: ambiences.volumeGains[id],
  }));

  const playlistEntry: PlaylistWriteEntry | null = playlists.id
    ? {
        id: playlists.id,
        label: playlists.label,
        targetGain: playlists.targetGain,
        volumeGain: playlists.volumeGain,
      }
    : null;

  send({
    type: "SYNC",
    payload: {
      scene,
      handout,
      ambiences: ambienceEntries,
      playlists: playlistEntry,
    },
  });
}
