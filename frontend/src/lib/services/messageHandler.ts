import type { TransportMessage } from "@/types/message";
import { router } from "@/stores/router.svelte";
import { sendSync } from "@/lib/services/transport";
import { sceneState } from "@/stores/sceneState.svelte";
import { appState } from "@/stores/appState.svelte";
import { ambienceEngine } from "@/lib/engines/ambienceEngine";
import { musicEngine } from "@/lib/engines/musicEngine";

export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const { sceneId, label } = message.payload;
      appState.scene = { id: sceneId, label };
      if (router.view === "player") {
        sceneState.requestedSceneId = sceneId;
      }
      break;
    }

    case "SET_AMBIENCES": {
      const { ambiences } = message.payload;
      appState.ambiences = ambiences;
      if (router.view === "player" && appState.audioReady) {
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
      if (router.view === "player" && appState.audioReady) {
        ambienceEngine.setVolume(id, volume);
      }
      break;
    }

    case "SET_PLAYLIST": {
      const { id, label } = message.payload;
      appState.music = { id, label, volume: appState.music?.volume ?? 0.5 };
      if (router.view === "player" && appState.audioReady)
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
      if (router.view === "player" && appState.audioReady)
        musicEngine.setVolume(message.payload.volume);
      break;
    }

    case "RESET_AUDIO": {
      if (router.view === "player" && appState.audioReady) {
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
      if (router.view === "controller") {
        sendSync();
      }
      break;
    }

    case "SYNC": {
      const { scene, ambiences, music } = message.payload;
      appState.scene = scene ? { id: scene.id, label: null } : null;
      appState.ambiences = ambiences ?? null;
      appState.music = music ? { ...music, label: music.label ?? null } : null;
      if (router.view === "player" && appState.audioReady) {
        if (scene) sceneState.requestedSceneId = scene.id;
        await ambienceEngine.syncActive(ambiences ?? []);
        await musicEngine.setPlaylist(music?.id ?? null);
        if (music) musicEngine.setVolume(music.volume);
      }
      break;
    }
  }
}
