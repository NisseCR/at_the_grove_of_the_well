import { appState } from "@/stores/appState.svelte";
import { sceneApiClient } from "@/lib/services/sceneApiClient";

class SceneEngine {
  async setScene(sceneId: string) {
    // Update state immediately so the UI reflects the change.
    appState.scene = { scene_id: sceneId };

    // Fetch the full config for rendering.
    const config = await sceneApiClient.fetchScene(sceneId);

    // Render the scene.
  }

  transitionScene(el: HTMLElement, newSrc: string): void {
    // gsap.killTweensOf(el); // cancel any in-progress tween
    // gsap.to(el, {
    //   opacity: 0,
    //   duration: 0.8,
    //   onComplete: () => {
    //     el.src = newSrc; // swap artwork at black
    //     gsap.to(el, { opacity: 1, duration: 0.8 });
    //   },
    // });
  }
}

export const sceneEngine = new SceneEngine();
