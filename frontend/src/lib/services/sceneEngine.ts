import { appState } from "@/stores/appState.svelte";
import { sceneApiClient } from "@/lib/services/sceneApiClient";
import { router } from "@/stores/router.svelte";
import { sceneState } from "@/stores/sceneState.svelte";
import type { SceneConfig } from "@/types/scene";
import { tick } from "svelte";
import { gsap } from "gsap";

const TRANSITION_DUDRATION = 4.0;
const PARALLAX_LAYER_INCREASE = 0.15;

class SceneEngine {
  /**
   * A token to cancel in-progress transition checkpoints when a new scene
   * is selected before the current transition completes.
   */
  private transitionToken: AbortController | null = null;

  /**
   * DOM reference to the current scene container.
   * Used by GSAP to animate the outgoing scene.
   */
  currentSceneContainer: HTMLElement | null = null;

  /**
   * DOM reference to the next scene container.
   * Used by GSAP to animate the incoming scene.
   */
  nextSceneContainer: HTMLElement | null = null;

  /**
   * TODO clear assets when setting new scene!
   */
  private Assets = new Map<string, HTMLElement>();

  /**
   * TODO
   * @param assetId
   * @param el
   */
  registerAsset(assetId: string, assetElement: HTMLElement): void {
    this.Assets.set(assetId, assetElement);
  }

  /**
   * TODO
   * @param assetId
   */
  deleteAsset(assetId: string): void {
    this.Assets.delete(assetId);
  }

  /**
   * Select and transition to a new scene.
   * Updates app state immediately for all views, then runs the full
   * transition pipeline on the player view only.
   *
   * @param sceneId - The id of the scene to transition to.
   */
  async setScene(sceneId: string): Promise<void> {
    const token = this.createToken();

    this.setSelectedScene(sceneId);
    if (router.view !== "player") return;

    await this.transitionScene(token, sceneId);
  }

  /**
   * Cancel any in-progress transition and create a new token for the
   * current transition. Each call to setScene gets its own token so
   * guards check against the correct transition.
   *
   * @returns A fresh AbortController for the new transition.
   */
  private createToken(): AbortController {
    this.transitionToken?.abort();
    const token = new AbortController();
    this.transitionToken = token;
    return token;
  }

  /**
   * Check whether the current transition has been superseded by a newer
   * scene selection. Throws an AbortError if so, which is caught and
   * silently swallowed in transitionScene.
   *
   * @param token - The token belonging to the current transition.
   * @throws DOMException with name "AbortError" if cancelled.
   */
  private guard(token: AbortController): void {
    if (token.signal.aborted) throw new DOMException("Cancelled", "AbortError");
  }

  /**
   * Run the full transition pipeline: fetch, preload, fade out, swap
   * slots, fade in. Guards are checked between each async step so a
   * newer scene selection cancels the pipeline cleanly.
   *
   * @param token - The transition token for this scene selection.
   * @param sceneId - The id of the scene to transition to.
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

      await this.transitionOut();
      this.guard(token);

      await this.swapSceneSlots();
      this.guard(token);

      await this.transitionIn();
    } catch (exception) {
      if (exception instanceof DOMException && exception.name === "AbortError")
        return;
      throw exception;
    }
  }

  /**
   * Update appState immediately so all views reflect the selected scene
   * without waiting for the transition to complete.
   *
   * @param sceneId - The id of the selected scene.
   */
  private setSelectedScene(sceneId: string): void {
    appState.scene = { scene_id: sceneId };
  }

  /**
   * Fetch the full scene config from the backend and stage it as the
   * next scene in sceneState.
   *
   * @param sceneId - The id of the scene to fetch.
   * @returns The fetched SceneConfig.
   */
  private async fetchNextScene(sceneId: string): Promise<SceneConfig> {
    sceneState.isTransitioning = true;
    const config = await sceneApiClient.fetchScene(sceneId);
    sceneState.next = config;
    return config;
  }

  /**
   * Preload all media assets in the incoming scene so they are ready
   * before the transition begins. Errors are swallowed per asset so a
   * single missing file does not block the transition.
   *
   * @param config - The scene config whose assets should be preloaded.
   */
  private async preload(config: SceneConfig): Promise<void> {
    const sources = [config.background.src, ...config.layers.map((l) => l.src)];
    await Promise.all(sources.map((source) => this.preloadAsset(source)));
  }

  /**
   * Route a single asset source to the appropriate preload method based
   * on its file extension.
   *
   * @param source - The asset URL to preload.
   * @returns A promise that resolves when the asset is ready.
   */
  private preloadAsset(source: string): Promise<void> {
    return source.endsWith(".webm") || source.endsWith(".mp4")
      ? this.preloadVideo(source)
      : this.preloadImage(source);
  }

  /**
   * Preload a video asset by creating an off-screen video element and
   * waiting for it to be ready to play.
   *
   * @param src - The video URL to preload.
   * @returns A promise that resolves when the video can play through.
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
   * Preload an image asset by creating an off-screen Image element and
   * waiting for it to load.
   *
   * @param src - The image URL to preload.
   * @returns A promise that resolves when the image has loaded.
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
   * Fade out the current scene container. Kills any in-progress fade on
   * the current slot and fade from wherever it currently is, thus
   * handling mid-fade interrupts cleanly.
   */
  private async transitionOut(): Promise<void> {
    if (!this.currentSceneContainer) return;

    gsap.killTweensOf(this.currentSceneContainer);
    await this.fadeOut();
  }

  /**
   * TODO
   */
  private async fadeOut(): Promise<void> {
    const fromOpacity = gsap.getProperty(
      this.currentSceneContainer,
      "opacity",
    ) as number;

    await gsap.to(this.currentSceneContainer, {
      opacity: 0,
      duration: 0.5 * fromOpacity,
      ease: "none",
    });
  }

  /**
   * Fade in the incoming scene container with a parallax zoom-out per layer.
   */
  private async transitionIn(): Promise<void> {
    if (!this.currentSceneContainer) return;

    gsap.killTweensOf(this.currentSceneContainer);
    this.fadeIn();
    this.parallaxZoomOut();
  }

  /**
   * TODO
   */
  private async fadeIn(): Promise<void> {
    await gsap.fromTo(
      this.currentSceneContainer,
      { opacity: 0 },
      { opacity: 1, duration: TRANSITION_DUDRATION, ease: "none" },
    );
  }

  /**
   * TODO
   */
  private async parallaxZoomOut(): Promise<void> {
    this.Assets.forEach((element) => {
      const zIndex = Number(element.style.zIndex);
      const scale = 1 + (1 + zIndex) * PARALLAX_LAYER_INCREASE;

      gsap.fromTo(
        element,
        { scale },
        { scale: 1, duration: TRANSITION_DUDRATION, ease: "power4.out" },
      );
    });
  }

  /**
   * Promote the next scene to current, clear the next slot, and wait
   * for Svelte to update the DOM before continuing. This ensures
   * currentSceneContainer points to the new scene when transitionIn runs.
   */
  private async swapSceneSlots(): Promise<void> {
    sceneState.current = sceneState.next;
    sceneState.next = null;
    sceneState.isTransitioning = false;
    await tick();
  }
}

export const sceneEngine = new SceneEngine();
