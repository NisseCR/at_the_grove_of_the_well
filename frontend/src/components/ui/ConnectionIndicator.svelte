<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
</script>

<div class="status" class:connected={appState.socketConnected}></div>

<style>
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
