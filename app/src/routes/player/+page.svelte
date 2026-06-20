<script lang="ts">
  import * as Tone from "tone";
  import { onMount, onDestroy } from "svelte";
  import { connect } from "$lib/services/transport";
  import SceneRenderer from "$lib/components/scene/SceneRenderer.svelte";
  import StoryGate from "$lib/components/scene/StoryGate.svelte";
  import AudioRenderer from "$lib/components/audio/AudioRenderer.svelte";
  import DebugOverlay from "./DebugOverlay.svelte";
  import VolumeOverlay from "./VolumeOverlay.svelte";
  import { appState } from "$lib/state/appState.svelte";
  import { sceneState } from "$lib/state/sceneState.svelte";

  /**
   * Called by StoryGate after its fade animation completes. Starts Tone.js
   * and sets renderReady — AudioReactor and SceneRenderer mount from here.
   */
  onMount(() => connect());

  async function unlock(): Promise<void> {
    await Tone.start();
    appState.renderReady = true;
  }

  onDestroy(() => {
    appState.renderReady = false;
  });
</script>

{#if !appState.renderReady}
  <StoryGate onunlock={unlock} title="At the Grove of the Well" />
{:else}
  <div class="player">
    <AudioRenderer state={appState} />
    <SceneRenderer
      bind:slotState={sceneState}
      requestedSceneId={appState.scene?.id ?? null}
    />
    <VolumeOverlay />
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
