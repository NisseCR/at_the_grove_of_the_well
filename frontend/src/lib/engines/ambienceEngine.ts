import { appState } from "@/stores/appState.svelte";

class AmbienceEngine {
  async setAmbience(ambienceId: string) {
    appState.ambiences = [{ ambience_id: ambienceId, volume: 1.0 }];
  }
}

export const ambienceEngine = new AmbienceEngine();
