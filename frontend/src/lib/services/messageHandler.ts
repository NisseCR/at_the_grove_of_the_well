import type { TransportMessage } from "@/types/message";
import { sceneEngine } from "@/lib/services/sceneEngine";
import { ambienceEngine } from "@/lib/services/ambienceEngine";
import { router } from "@/stores/router.svelte";
import { sendSync } from "@/lib/services/transport";

export async function handleMessage(message: TransportMessage): Promise<void> {
  switch (message.type) {
    case "SET_SCENE": {
      const sceneId = message.payload.sceneId;
      await sceneEngine.setScene(sceneId);
      break;
    }

    case "SET_AMBIENCE": {
      const ambienceId = message.payload.ambienceId;
      await ambienceEngine.setAmbience(ambienceId);
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
