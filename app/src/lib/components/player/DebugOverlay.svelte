<script lang="ts">
  import { appState } from "$lib/state/appState.svelte";
  import { sceneState } from "$lib/state/sceneState.svelte";
</script>

<div class="debug">
  <section>
    <h4>appState</h4>
    <pre>{JSON.stringify(appState, null, 2)}</pre>
  </section>
  <section>
    <h4>sceneState</h4>
    <pre>{JSON.stringify(sceneState, null, 2)}</pre>
  </section>
</div>

<style>
  .debug {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    gap: 1rem;
    z-index: 9999;
    pointer-events: none;
    max-height: 80vh;
  }

  section {
    background: rgba(0, 0, 0, 0.7);
    color: #0f0;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.7rem;
    overflow-y: auto;
    max-width: 400px;
    pointer-events: all;
  }

  h4 {
    margin: 0 0 0.4rem;
    color: #fff;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
  }
</style>
