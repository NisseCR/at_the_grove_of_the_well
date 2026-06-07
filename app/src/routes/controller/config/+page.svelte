<script lang="ts">
  import { appState } from "$lib/stores/appState.svelte";
  import { sendSetDebug } from "$lib/services/transport";

  $effect(() => {
    sendSetDebug(appState.debug);
  });
</script>

<div class="config">
  <section class="section">
    <h2 class="section-title">Debug</h2>
    <label class="setting">
      <span class="setting-label">Show debug overlay on player</span>
      <input type="checkbox" bind:checked={appState.debug} />
    </label>
  </section>
</div>

<style>
  .config {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    cursor: pointer;
  }

  .setting-label {
    font-size: var(--text-sm);
    color: var(--color-text);
  }
</style>
