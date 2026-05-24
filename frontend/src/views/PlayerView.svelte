<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
</script>

<div class="player">
  {#if appState.scene?.scene_id}
    <h1>{appState.scene.scene_id}</h1>
  {:else}
    <p>Waiting for scene…</p>
  {/if}

  <div class="status" class:connected={appState.socketConnected}></div>
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

  h1 {
    font-size: 3rem;
    font-weight: 200;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  p {
    color: #444;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Connection indicator dot */
  .status {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #333;
    transition: background 0.3s;
  }

  .status.connected {
    background: #4ade80;
  }
</style>
