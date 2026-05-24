import { appState } from "@/stores/appState.svelte";

class SceneEngine {
  async setScene(sceneId: string) {
    appState.scene = { scene_id: sceneId };
  }
}

export const sceneEngine = new SceneEngine();
