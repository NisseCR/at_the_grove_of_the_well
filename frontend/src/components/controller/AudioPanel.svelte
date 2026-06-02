<script lang="ts">
  import { RotateCcw } from "@lucide/svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendResetAudio } from "@/lib/services/transport";
  import MusicRow from "@/components/controller/MusicRow.svelte";
  import AmbienceRow from "@/components/controller/AmbienceRow.svelte";

  const hasMusic = $derived(appState.music?.playlistId != null);
  const hasAmbiences = $derived((appState.ambiences?.length ?? 0) > 0);
</script>

<aside class="audio-panel">
  <div class="panel-header">
    <h2 class="panel-title">Audio</h2>
    <button class="reset-btn" onclick={sendResetAudio} aria-label="Reset audio">
      <RotateCcw size={13} />
    </button>
  </div>

  {#if hasMusic}
    <section class="section">
      <span class="section-label">Music</span>
      <MusicRow />
    </section>
  {/if}

  {#if hasAmbiences}
    <section class="section">
      <span class="section-label">Ambiences</span>
      {#each appState.ambiences! as ambience (ambience.id)}
        <AmbienceRow {ambience} />
      {/each}
    </section>
  {/if}

  {#if !hasMusic && !hasAmbiences}
    <p class="empty">Nothing active</p>
  {/if}
</aside>

<style>
  .audio-panel {
    width: 260px;
    flex-shrink: 0;
    border-left: 1px solid var(--color-border);
    padding: var(--space-4);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-title {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }

  .reset-btn {
    display: flex;
    align-items: center;
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .reset-btn:hover {
    color: var(--color-text);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .section-label {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-1);
  }

  .empty {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-faint);
  }
</style>
