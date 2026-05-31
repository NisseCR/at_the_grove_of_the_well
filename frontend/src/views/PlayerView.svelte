<script lang="ts">
  import * as Tone from "tone";
  import SceneRenderer from "@/components/player/SceneRenderer.svelte";
  import ConnectionIndicator from "@/components/player/ConnectionIndicator.svelte";
  import StoryGate from "@/components/player/StoryGate.svelte";

  let started = $state(false);

  async function begin() {
    await Tone.start();
    started = true;
  }
</script>

{#if started}
  <div class="player">
    <SceneRenderer />
    <ConnectionIndicator />
  </div>
{:else}
  <StoryGate onbegin={begin} />
{/if}

<style>
  .player {
    position: fixed;
    inset: 0;
    background: #0a0a0a;
    overflow: hidden;
  }
</style>
