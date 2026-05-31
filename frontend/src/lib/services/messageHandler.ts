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

    case "SYNC_AMBIENCES": {
      const { ambienceIds } = message.payload;
      appState.ambiences = ambienceIds.map((id) => ({ id, volume: 0.5 }));
      if (router.view === "player") {
        await ambienceEngine.syncActive(ambienceIds);
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
