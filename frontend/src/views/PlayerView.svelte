<script lang="ts">
  import SceneRenderer from "@/components/player/SceneRenderer.svelte";
  import StoryGate from "@/components/player/StoryGate.svelte";
  // import DebugOverlay from "@/components/player/DebugOverlay.svelte";
  import { appState } from "@/stores/appState.svelte";
</script>

{#if !appState.audioReady}
  <StoryGate />
{:else}
  <div class="player">
    <SceneRenderer />
    <!-- <DebugOverlay /> -->
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
