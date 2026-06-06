import type { TransportMessage } from "$lib/types/message";
import { appState } from "$lib/stores/appState.svelte";

/**
 * @param message - Incoming WebSocket message from the relay.
 */
export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const { sceneId, label } = message.payload;
      appState.scene = { id: sceneId, label };
      break;
    }

    case "SET_AMBIENCES": {
      appState.ambiences = message.payload.ambiences;
      break;
    }

    case "SET_AMBIENCE_VOLUME": {
      const { id, volume } = message.payload;
      if (appState.ambiences) {
        const entry = appState.ambiences.find((a) => a.id === id);
        if (entry) entry.volume = volume;
      }
      break;
    }

    case "SET_PLAYLIST": {
      const { id, label } = message.payload;
      appState.music = { id, label, volume: appState.music?.volume ?? 0.5 };
      break;
    }

    case "SET_MUSIC_VOLUME": {
      if (!appState.music)
        appState.music = {
          id: null,
          label: null,
          volume: message.payload.volume,
        };
      else appState.music.volume = message.payload.volume;
      break;
    }

    case "RESET_AUDIO": {
      appState.resetAudioVersion++;
      break;
    }

    case "SET_DEBUG": {
      appState.debug = message.payload.debug;
      break;
    }

    case "CLIENT_CONNECTED": {
      appState.clientConnectedVersion++;
      break;
    }

    case "SYNC": {
      const { scene, ambiences, music } = message.payload;
      appState.scene = scene ? { id: scene.id, label: null } : null;
      appState.ambiences = ambiences ?? null;
      appState.music = music ? { ...music, label: music.label ?? null } : null;
      break;
    }
  }
}
