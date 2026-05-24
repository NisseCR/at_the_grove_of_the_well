<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
  import ConnectionIndicator from "@/components/ui/ConnectionIndicator.svelte";
</script>

<div class="player">
  {#if appState.scene?.scene_id}
    <h1>{appState.scene.scene_id}</h1>
  {:else}
    <p>Waiting for scene…</p>
  {/if}

  <ConnectionIndicator />
</div>

<style>
  .player {
    position: fixed;
    inset: 0;
    background: #0a0a0a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
</style>
