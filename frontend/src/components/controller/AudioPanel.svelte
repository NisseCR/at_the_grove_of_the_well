<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
  import { sendSyncAmbiences } from "@/lib/services/transport";

  function removeAmbience(id: string): void {
    const next = (appState.ambiences ?? []).filter((a) => a.id !== id);
    sendSyncAmbiences(next.map((a) => a.id));
  }

  const hasAmbiences = $derived((appState.ambiences?.length ?? 0) > 0);
</script>

<aside class="audio-panel">
  <h2 class="panel-title">Audio</h2>

  {#if hasAmbiences}
    <section class="section">
      <span class="section-label">Ambiences</span>
      {#each appState.ambiences! as ambience (ambience.id)}
        <div class="row">
          <span class="audio-name">{ambience.id}</span>
          <button class="dismiss" onclick={() => removeAmbience(ambience.id)} aria-label="Remove {ambience.id}">×</button>
        </div>
      {/each}
    </section>
  {:else}
    <p class="empty">Nothing active</p>
  {/if}
</aside>

<style>
  .audio-panel {
    width: 200px;
    flex-shrink: 0;
    border-left: 1px solid var(--color-border);
    padding: var(--space-4);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .panel-title {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .section-label {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-1);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-glass);
  }

  .audio-name {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dismiss {
    flex-shrink: 0;
    font-size: 16px;
    line-height: 1;
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .dismiss:hover {
    color: var(--color-text);
  }

  .empty {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-faint);
  }
</style>
