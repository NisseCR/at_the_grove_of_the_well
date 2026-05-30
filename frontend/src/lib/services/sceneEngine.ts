import { appState } from "@/stores/appState.svelte";
import { sceneApiClient } from "@/lib/services/sceneApiClient";
import { router } from "@/stores/router.svelte";
import { sceneState } from "@/stores/sceneState.svelte";
import type { SceneConfig } from "@/types/scene";

class SceneEngine {
  async setScene(sceneId: string) {
    // Update state immediately so the UI reflects the change.
    this.setSelectedScene(sceneId);

    // Only apply remaining logic for player view.
    if (router.view !== "player") return;

    // Fetch the full config for rendering.
    const config = await this.fetchNextScene(sceneId);

    // Wait for media to load.
    await this.preload(config);

    // Render the scene.
    await this.transitionScene();

    // Swap slots.
    this.applyScene();
  }

  /**
   * Update state immediately so the UI reflects the change.
   * @param sceneId
   */
  private setSelectedScene(sceneId: string) {
    appState.scene = { scene_id: sceneId };
  }

  /**
   * Fetch the full config for rendering.
   * @param sceneId
   */
  private async fetchNextScene(sceneId: string): Promise<SceneConfig> {
    sceneState.isTransitioning = true;
    const config = await sceneApiClient.fetchScene(sceneId);
    sceneState.next = config;
    return config;
  }

  /**
   * Load media from scene.
   * @param config
   */
  private async preload(config: SceneConfig): Promise<void> {
    const sources = [
      config.background.src,
      ...config.layers.map((layer) => layer.src),
    ];

    sources.forEach(function (entry) {
      console.log(entry);
    });
  }

  private async transitionScene(): Promise<void> {
    const delay = (duration: number) =>
      new Promise((resolve) => setTimeout(resolve, duration));
    console.log("Waiting for 2 seconds...");
    await delay(2000);
    console.log("2 seconds have passed!");
  }

  private applyScene() {
    sceneState.current = sceneState.next;
    sceneState.next = null;
    sceneState.isTransitioning = false;
  }
}

export const sceneEngine = new SceneEngine();
