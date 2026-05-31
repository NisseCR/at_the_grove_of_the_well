import type { TransportMessage } from "@/types/message";
import { ambienceEngine } from "@/lib/engines/ambienceEngine";
import { router } from "@/stores/router.svelte";
import { sendSync } from "@/lib/services/transport";
import { sceneState } from "@/stores/sceneState.svelte";

export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      sceneState.requestedSceneId = message.payload.sceneId;
      break;
    }

    case "SYNC_AMBIENCES": {
      const ambienceIds = message.payload.ambienceIds;
      ambienceEngine.syncActive(ambienceIds);
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
        // TODO implement sync
      }
      break;
  }
}
