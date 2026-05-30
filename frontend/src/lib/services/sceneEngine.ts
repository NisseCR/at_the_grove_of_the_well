import { appState } from "@/stores/appState.svelte";
import { sceneApiClient } from "@/lib/services/sceneApiClient";
import { router } from "@/stores/router.svelte";
import { sceneState } from "@/stores/sceneState.svelte";
import type { SceneConfig } from "@/types/scene";
import { tick } from "svelte";

class SceneEngine {
  /**
   * A token to check against to determine whether to cancel await checkpoints of SceneEngine.
   */
  private transitionToken: AbortController | null = null;

  /**
   * DOM reference of the current scene container.
   */
  currentSceneContainer: HTMLElement | null = null;

  /**
   * DOM reference of the next scene container.
   */
  nextSceneContainer: HTMLElement | null = null;

  /**
   *
   * @param sceneId
   * @returns
   */
  async setScene(sceneId: string) {
    const token = this.createToken();

    this.setSelectedScene(sceneId);
    if (router.view !== "player") return;

    await this.transitionScene(token, sceneId);
  }

  /**
   *
   * @returns
   */
  private createToken(): AbortController {
    this.transitionToken?.abort();
    const token = new AbortController();
    this.transitionToken = token;
    return token;
  }

  /**
   *
   * @param token
   */
  private guard(token: AbortController) {
    if (token.signal.aborted) throw new DOMException("Cancelled", "AbortError");
  }

  /**
   *
   * @param token
   * @param sceneId
   * @returns
   */
  private async transitionScene(
    token: AbortController,
    sceneId: string,
  ): Promise<void> {
    try {
      const config = await this.fetchNextScene(sceneId);
      this.guard(token);

      await this.preload(config);
      this.guard(token);

      await this.transitionIn();
      this.guard(token);

      await this.swapSceneSlots();
      this.guard(token);

      await this.transitionOut();
    } catch (exception) {
      if (exception instanceof DOMException && exception.name === "AbortError")
        return;
      throw exception;
    }
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
   *
   * @param config
   */
  private async preload(config: SceneConfig): Promise<void> {
    const sources = [config.background.src, ...config.layers.map((l) => l.src)];
    await Promise.all(sources.map((source) => this.preloadAsset(source)));
  }

  /**
   *
   * @param source
   * @returns
   */
  private preloadAsset(source: string): Promise<void> {
    return source.endsWith(".webm") || source.endsWith(".mp4")
      ? this.preloadVideo(source)
      : this.preloadImage(source);
  }

  /**
   *
   * @param src
   * @returns
   */
  private preloadVideo(src: string): Promise<void> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = src;
      video.oncanplaythrough = () => resolve();
      video.onerror = () => resolve();
      video.load();
    });
  }

  /**
   *
   * @param src
   * @returns
   */
  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }

  /**
   *
   */
  private async transitionOut(): Promise<void> {
    // TODO fade out.
    const delay = (duration: number) =>
      new Promise((resolve) => setTimeout(resolve, duration));
    await delay(2000);
  }

  /**
   *
   */
  private async transitionIn(): Promise<void> {
    // TODO fade in.
    // TODO parallax zoom out per layer.
    const delay = (duration: number) =>
      new Promise((resolve) => setTimeout(resolve, duration));
    await delay(2000);
  }

  private async swapSceneSlots() {
    sceneState.current = sceneState.next;
    sceneState.next = null;
    sceneState.isTransitioning = false;
    await tick();
  }
}

export const sceneEngine = new SceneEngine();
