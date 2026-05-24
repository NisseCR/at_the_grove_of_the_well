import { appState } from "@/stores/appState.svelte";
import { sceneApiClient } from "@/lib/services/sceneApiClient";
import { router } from "@/stores/router.svelte";
import { sceneState } from "@/stores/sceneState.svelte";

class SceneEngine {
  async setScene(sceneId: string) {
    // Update state immediately so the UI reflects the change.
    appState.scene = { scene_id: sceneId };

    // Only apply remaining logic for player view.
    if (router.view != "player") {
      return;
    }

    // Fetch the full config for rendering.
    sceneState.config = await sceneApiClient.fetchScene(sceneId);

    // Render the scene.
    // TODO implement.
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
