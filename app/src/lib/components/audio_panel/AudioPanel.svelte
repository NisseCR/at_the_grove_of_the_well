<script lang="ts">
  import { RotateCcw } from "@lucide/svelte";
  import { appState } from "$lib/state/appState.svelte";
  import { sendResetAudio } from "$lib/services/transport";
  import MusicRow from "$lib/components/audio_panel/MusicRow.svelte";
  import AmbienceRow from "$lib/components/audio_panel/AmbienceRow.svelte";

  let { collapsed = $bindable(false) }: { collapsed: boolean } = $props();

  const hasMusic = $derived(appState.playlists.id != null);
  const hasAmbiences = $derived(appState.ambiences.ids.length > 0);
</script>

<aside class="audio-panel" class:collapsed>
  <div class="panel-header">
    <h2 class="panel-title">Audio</h2>
    <button class="reset-btn" onclick={sendResetAudio} aria-label="Reset audio">
      <RotateCcw size={13} />
    </button>
  </div>

  <div class="panel-body">
    {#if hasMusic}
      <section class="section">
        <span class="section-label">Music</span>
        <MusicRow />
      </section>
    {/if}

    {#if hasAmbiences}
      <section class="section">
        <span class="section-label">Ambiences</span>
        {#each appState.ambiences.ids as id (id)}
          <AmbienceRow {id} />
        {/each}
      </section>
    {/if}

    {#if !hasMusic && !hasAmbiences}
      <p class="empty">Nothing active</p>
    {/if}
  </div>
</aside>

<style>
  .audio-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    width: 260px;
    background: rgba(8, 6, 14, 0.97);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width var(--ease-base);
  }

  .audio-panel.collapsed {
    width: 0;
  }

  .panel-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    opacity: 1;
    transition: opacity var(--ease-fast);
  }

  .audio-panel.collapsed .panel-header {
    opacity: 0;
    pointer-events: none;
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
    padding: var(--space-3);
    margin: calc(-1 * var(--space-3));
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .reset-btn:hover {
    color: var(--color-text);
  }

  .panel-body {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    opacity: 1;
    transition: opacity var(--ease-fast);
  }

  .audio-panel.collapsed .panel-body {
    opacity: 0;
    pointer-events: none;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .section-label {
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-1);
  }

  .empty {
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-faint);
  }
</style>
