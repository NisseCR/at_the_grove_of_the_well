<script lang="ts">
  import { RotateCcw } from "@lucide/svelte";
  import { appState } from "$lib/stores/appState.svelte";
  import { sendResetAudio } from "$lib/services/transport";
  import MusicRow from "./MusicRow.svelte";
  import AmbienceRow from "./AmbienceRow.svelte";

  let { collapsed = $bindable(false) }: { collapsed: boolean } = $props();

  const hasMusic = $derived(appState.music?.id != null);
  const hasAmbiences = $derived((appState.ambiences?.length ?? 0) > 0);
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
        {#each appState.ambiences! as ambience (ambience.id)}
          <AmbienceRow {ambience} />
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
    width: 260px;
    flex-shrink: 0;
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width var(--ease-base);
    z-index: 1;
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
    padding-bottom: 0;
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
    gap: var(--space-4);
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

  @media (max-width: 640px) {
    .audio-panel {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 10;
      background: rgba(8, 6, 14, 0.97);
      backdrop-filter: blur(var(--blur-md));
      -webkit-backdrop-filter: blur(var(--blur-md));
    }

    .reset-btn {
      padding: var(--space-3);
      margin: calc(-1 * var(--space-3));
    }

    .panel-header {
      padding: var(--space-4);
    }

    .panel-body {
      padding: var(--space-4);
      gap: var(--space-6);
    }

    .section-label {
      font-size: var(--text-sm);
    }

    .empty {
      font-size: var(--text-sm);
    }
  }
</style>
