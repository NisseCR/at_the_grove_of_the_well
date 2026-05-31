<script lang="ts">
  import * as Tone from "tone";
  import SceneRenderer from "@/components/player/SceneRenderer.svelte";
  import ConnectionIndicator from "@/components/player/ConnectionIndicator.svelte";
  import StoryGate from "@/components/player/StoryGate.svelte";
  // import DebugOverlay from "@/components/player/DebugOverlay.svelte";
  import { audioEngine } from "@/lib/engines/audioEngine";
  import { ambienceEngine } from "@/lib/engines/ambienceEngine";
  import { appState } from "@/stores/appState.svelte";

  let started = $state(false);

  async function begin() {
    await Tone.start();
    audioEngine.started = true;
    started = true;
    const ids = appState.ambiences?.map((a) => a.id) ?? [];
    if (ids.length > 0) await ambienceEngine.syncActive(ids);
  }
</script>

{#if started}
  <div class="player">
    <SceneRenderer />
    <ConnectionIndicator />
    <!-- <DebugOverlay /> -->
  </div>
{:else}
  <StoryGate onbegin={begin} />
{/if}

<style>
  .player {
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    overflow: hidden;
  }
</style>
