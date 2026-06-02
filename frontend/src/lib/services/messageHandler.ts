import type { TransportMessage } from "@/types/message";
import { router } from "@/stores/router.svelte";
import { sendSync } from "@/lib/services/transport";
import { sceneState } from "@/stores/sceneState.svelte";
import { appState } from "@/stores/appState.svelte";
import { ambienceEngine } from "@/lib/engines/ambienceEngine";

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

    case "RESET_AUDIO": {
      if (router.view === "player") {
        const entries = appState.ambiences ?? [];
        await ambienceEngine.hardReset(entries);
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
