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
      const { sceneId } = message.payload;
      appState.scene = { id: sceneId };
      if (router.view === "player") {
        sceneState.requestedSceneId = sceneId;
      }
      break;
    }

    case "SET_AMBIENCES": {
      const { ambiences } = message.payload;
      appState.ambiences = ambiences;
      if (router.view === "player") {
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
      if (router.view === "player") {
        ambienceEngine.setVolume(id, volume);
      }
      break;
    }

    case "SET_PLAYLIST": {
      if (!appState.music) appState.music = { playlistId: null, volume: 0.5 };
      appState.music.playlistId = message.payload.playlistId;
      if (router.view === "player")
        await musicEngine.setPlaylist(message.payload.playlistId);
      break;
    }

    case "SET_MUSIC_VOLUME": {
      if (!appState.music) appState.music = { playlistId: null, volume: message.payload.volume };
      else appState.music.volume = message.payload.volume;
      if (router.view === "player")
        musicEngine.setVolume(message.payload.volume);
      break;
    }

    case "RESET_AUDIO": {
      if (router.view === "player") {
        await ambienceEngine.hardReset(appState.ambiences ?? []);
        await musicEngine.hardReset(appState.music?.playlistId ?? null);
      }
      break;
    }

    case "CLIENT_CONNECTED": {
      if (router.view === "controller") {
        sendSync();
      }
      break;
    }

    case "SYNC":
      if (router.view === "player") {
        // TODO implement sync later on.
      }
      break;
  }
}
