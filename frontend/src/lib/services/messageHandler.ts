import type { TransportMessage } from "$lib/types/message";
import { page } from "$app/state";
import { sendSync } from "$lib/services/transport";
import { sceneState } from "$lib/stores/sceneState.svelte";
import { appState } from "$lib/stores/appState.svelte";
import { ambienceEngine } from "$lib/engines/ambienceEngine";
import { musicEngine } from "$lib/engines/musicEngine";

export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const { sceneId, label } = message.payload;
      appState.scene = { id: sceneId, label };
      if (page.url.pathname === "/player") {
        sceneState.requestedSceneId = sceneId;
      }
      break;
    }

    case "SET_AMBIENCES": {
      const { ambiences } = message.payload;
      appState.ambiences = ambiences;
      if (page.url.pathname === "/player" && appState.renderReady) {
        await ambienceEngine.syncActive(ambiences);
      }
      break;
    }

    case "SET_AMBIENCE_VOLUME": {
      const { id, volume } = message.payload;
      if (appState.ambiences) {
        const entry = appState.ambiences.find((a) => a.id === id);
        if (entry) entry.volume = volume;
      }
      if (page.url.pathname === "/player" && appState.renderReady) {
        ambienceEngine.setVolume(id, volume);
      }
      break;
    }

    case "SET_PLAYLIST": {
      const { id, label } = message.payload;
      appState.music = { id, label, volume: appState.music?.volume ?? 0.5 };
      if (page.url.pathname === "/player" && appState.renderReady)
        await musicEngine.setPlaylist(id);
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
      if (page.url.pathname === "/player" && appState.renderReady)
        musicEngine.setVolume(message.payload.volume);
      break;
    }

    case "RESET_AUDIO": {
      if (page.url.pathname === "/player" && appState.renderReady) {
        await ambienceEngine.hardReset(appState.ambiences ?? []);
        await musicEngine.hardReset(appState.music?.id ?? null);
      }
      break;
    }

    case "SET_DEBUG": {
      appState.debug = message.payload.debug;
      break;
    }

    case "CLIENT_CONNECTED": {
      if (page.url.pathname === "/controller") {
        sendSync();
      }
      break;
    }

    case "SYNC": {
      const { scene, ambiences, music } = message.payload;
      appState.scene = scene ? { id: scene.id, label: null } : null;
      appState.ambiences = ambiences ?? null;
      appState.music = music ? { ...music, label: music.label ?? null } : null;
      if (page.url.pathname === "/player" && appState.renderReady) {
        if (scene) sceneState.requestedSceneId = scene.id;
        await ambienceEngine.syncActive(ambiences ?? []);
        await musicEngine.setPlaylist(music?.id ?? null);
        if (music) musicEngine.setVolume(music.volume);
      }
      break;
    }
  }
}
