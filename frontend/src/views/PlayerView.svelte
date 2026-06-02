<script lang="ts">
  import { onMount } from "svelte";
  import * as Tone from "tone";
  import SceneRenderer from "@/components/player/SceneRenderer.svelte";
  // import DebugOverlay from "@/components/player/DebugOverlay.svelte";
  import { ambienceEngine } from "@/lib/engines/ambienceEngine";
  import { musicEngine } from "@/lib/engines/musicEngine";
  import { appState } from "@/stores/appState.svelte";

  onMount(async () => {
    await Tone.start();
    const ambiences = appState.ambiences ?? [];
    if (ambiences.length > 0) await ambienceEngine.syncActive(ambiences);
    if (appState.music?.playlistId) await musicEngine.setPlaylist(appState.music.playlistId);
  });
</script>

<div class="player">
  <SceneRenderer />
  <!-- <DebugOverlay /> -->
</div>

<style>
  .player {
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    overflow: hidden;
  }
</style>
