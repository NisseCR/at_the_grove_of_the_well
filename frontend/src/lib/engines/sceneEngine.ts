import { sceneApiClient } from "@/lib/services/sceneApiClient";
import { sceneState } from "@/stores/sceneState.svelte";
import { guardedAwait } from "@/lib/utils/guardedAwait";
import type { SceneConfig } from "@/types/scene";
import { tick } from "svelte";
import { gsap } from "gsap";

const TRANSITION_DUDRATION = 3;
const PARALLAX_LAYER_INCREASE = 0.04;

class SceneEngine {
  /**
   * A token to cancel in-progress transition checkpoints when a new scene
   * is selected before the current transition completes.
   */
  private transitionToken: AbortController | null = null;

  /**
   * Run the full transition pipeline: fetch, preload, fade out, swap
   * slots, fade in. Guards are checked between each async step so a
   * newer scene selection cancels the pipeline cleanly.
   *
   * @param token - The transition token for this scene selection.
   * @param sceneId - The id of the scene to transition to.
   * @param getCurrent - Getter for the current scene container, read live at
   *   each usage point so it reflects the DOM state after slot swaps.
   */
  async transitionScene(
    sceneId: string,
    getCurrent: () => HTMLElement | null,
  ): Promise<void> {
    const token = this.createToken();

    try {
      const config = await guardedAwait(this.fetchNextScene(sceneId), token);
      await guardedAwait(this.preload(config), token);
      await guardedAwait(this.transitionOut(getCurrent()), token);
      await guardedAwait(this.swapSceneSlots(), token);
      await this.transitionIn(getCurrent());
    } catch (exception) {
      if (exception instanceof DOMException && exception.name === "AbortError")
        return;
      throw exception;
    }
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
   * Fade out the outgoing scene container. No-ops if the container is null,
   * e.g. when transitioning from no scene.
   *
   * @param container - The container to fade out.
   */
  private async transitionOut(container: HTMLElement | null): Promise<void> {
    if (!container) return;

    await this.fadeOut(container);
  }

  /**
   * Fade out the given container from its current opacity to zero.
   * Duration scales with the current opacity so mid-fade interrupts finish
   * proportionally rather than always running the full duration.
   *
   * @param container - The container to fade out.
   */
  private async fadeOut(container: HTMLElement): Promise<void> {
    gsap.killTweensOf(container);

    const fromOpacity = gsap.getProperty(container, "opacity") as number;

    await gsap.to(container, {
      opacity: 0,
      duration: TRANSITION_DUDRATION * fromOpacity,
      ease: "none",
    });
  }

  /**
   * Fade in the incoming scene container with a parallax zoom-out per layer.
   * Receives the current container after the slot swap, which now holds the
   * incoming scene. No-ops if the container is null.
   *
   * @param container - The container to fade in.
   */
  private async transitionIn(container: HTMLElement | null): Promise<void> {
    if (!container) return;

    this.fadeIn(container);
    this.parallaxZoomOut(container);
  }

  /**
   * Fade in the given container from opacity 0 to 1. Kills any in-progress
   * fade first so rapid scene switches don't stack tweens. Fire-and-forget —
   * called without await from transitionIn.
   *
   * @param container - The container to fade in.
   */
  private async fadeIn(container: HTMLElement): Promise<void> {
    gsap.killTweensOf(container);

    gsap.fromTo(
      container,
      { opacity: 0 },
      { opacity: 1, duration: TRANSITION_DUDRATION, ease: "none" },
    );
  }

  /**
   * Animate each layer in the given container from its parallax start scale
   * back to natural scale. Layers at higher z-index start at a larger scale
   * so they appear to move faster, creating a depth effect. Kills any
   * in-progress tween per element so re-selecting a scene always replays
   * from the correct starting scale.
   *
   * @param container - The container whose `.fill` children are animated.
   */
  private parallaxZoomOut(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>(".fill").forEach((element) => {
      gsap.killTweensOf(element);

      const zIndex = Number(element.style.zIndex);
      const scale = 1 + (1 + zIndex) * PARALLAX_LAYER_INCREASE;
      const duration = Math.min(TRANSITION_DUDRATION * 0.5, 1.25);

      gsap.fromTo(
        element,
        { scale },
        { scale: 1, duration, ease: "power1.out" },
      );
    });
  }

  /**
   * Promote the next scene to current, clear the next slot, and wait
   * for Svelte to update the DOM before continuing.
   */
  private async swapSceneSlots(): Promise<void> {
    sceneState.current = sceneState.next;
    sceneState.next = null;
    sceneState.isTransitioning = false;
    await tick();
  }
}

export const sceneEngine = new SceneEngine();
