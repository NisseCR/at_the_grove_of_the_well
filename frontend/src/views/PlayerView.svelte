<script lang="ts">
  import * as Tone from "tone";
  import { onDestroy } from "svelte";
  import SceneRenderer from "@/components/scene/SceneRenderer.svelte";
  import StoryGate from "@/components/scene/StoryGate.svelte";
  import DebugOverlay from "@/components/player/DebugOverlay.svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sceneState } from "@/stores/sceneState.svelte";
  import { ambienceEngine } from "@/lib/engines/ambienceEngine";
  import { musicEngine } from "@/lib/engines/musicEngine";

  /**
   * Called by StoryGate after its fade animation completes. Starts Tone.js
   * and applies the initial scene/ambience/music state from the server.
   */
  async function unlock(): Promise<void> {
    await Tone.start();
    appState.renderReady = true;

    if (appState.scene?.id) sceneState.requestedSceneId = appState.scene.id;
    if (appState.ambiences?.length)
      await ambienceEngine.syncActive(appState.ambiences);
    if (appState.music?.id)
      await musicEngine.setPlaylist(appState.music.id, appState.music.volume);
  }

  onDestroy(() => {
    musicEngine.reset();
    ambienceEngine.syncActive([]);
    sceneState.current = null;
    sceneState.next = null;
    sceneState.isTransitioning = false;
    sceneState.requestedSceneId = null;
    appState.renderReady = false;
  });
</script>

{#if !appState.renderReady}
  <StoryGate onunlock={unlock} title="At the Grove of the Well" />
{:else}
  <div class="player">
    <SceneRenderer slotState={sceneState} />
    {#if appState.debug}<DebugOverlay />{/if}
  </div>
{/if}

<style>
  .player {
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    overflow: hidden;
  }
</style>
