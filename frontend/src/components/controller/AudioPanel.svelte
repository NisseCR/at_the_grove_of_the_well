<script lang="ts">
  import { AudioLines, Volume, Volume1, Volume2, VolumeX, X } from "@lucide/svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetAmbiences, sendSetAmbienceVolume } from "@/lib/services/transport";

  function removeAmbience(id: string): void {
    const next = (appState.ambiences ?? []).filter((a) => a.id !== id);
    sendSetAmbiences(next);
  }

  function onVolumeChange(id: string, value: number): void {
    const clamped = Math.min(1, Math.max(0, value));
    if (appState.ambiences) {
      const entry = appState.ambiences.find((a) => a.id === id);
      if (entry) entry.volume = clamped;
    }
    sendSetAmbienceVolume(id, clamped);
  }

  function onVolumeWheel(e: WheelEvent, id: string): void {
    e.preventDefault();
    const current = appState.ambiences?.find((a) => a.id === id)?.volume ?? 0;
    onVolumeChange(id, current - e.deltaY * 0.001);
  }

  function volumeIcon(v: number) {
    if (v === 0) return VolumeX;
    if (v < 0.35) return Volume;
    if (v < 0.65) return Volume1;
    return Volume2;
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
          <div class="row-header">
            <AudioLines class="icon name-icon" size={13} />
            <span class="audio-name">{ambience.id}</span>
            <button class="dismiss" onclick={() => removeAmbience(ambience.id)} aria-label="Remove {ambience.id}">
              <X size={16} />
            </button>
          </div>
          <div class="volume-row" onwheel={(e) => onVolumeWheel(e, ambience.id)}>
            <svelte:component this={volumeIcon(ambience.volume)} class="icon vol-icon" size={13} />
            <input
              class="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambience.volume}
              oninput={(e) => onVolumeChange(ambience.id, (e.currentTarget as HTMLInputElement).valueAsNumber)}
            />
          </div>
        </div>
      {/each}
    </section>
  {:else}
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
    gap: var(--space-2);
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
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-glass);
  }

  .row-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .audio-name {
    flex: 1;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dismiss {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .dismiss:hover {
    color: var(--color-text);
  }

  /* ─── Volume row ────────────────────────────────────────────────────────── */
  .volume-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  :global(.vol-icon) {
    flex-shrink: 0;
    color: var(--color-text-faint);
  }

  :global(.name-icon) {
    flex-shrink: 0;
    color: var(--color-accent-dim);
  }

  /* ─── Slider ────────────────────────────────────────────────────────────── */
  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: var(--color-border);
    outline: none;
    cursor: pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    transition: background var(--ease-fast);
  }

  .volume-slider:hover::-webkit-slider-thumb {
    background: var(--color-text);
  }

  .volume-slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border: none;
    border-radius: 50%;
    background: var(--color-accent);
    transition: background var(--ease-fast);
  }

  .volume-slider:hover::-moz-range-thumb {
    background: var(--color-text);
  }

  .empty {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-faint);
  }
</style>
