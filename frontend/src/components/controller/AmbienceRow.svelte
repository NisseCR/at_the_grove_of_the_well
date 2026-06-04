<script lang="ts">
  import { AudioLines, Volume, Volume1, Volume2, VolumeX, X } from "@lucide/svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetAmbiences, sendSetAmbienceVolume } from "@/lib/services/transport";
  import type { ActiveAmbience } from "@/types/state";

  const { ambience }: { ambience: ActiveAmbience } = $props();

  function volumeIcon(v: number) {
    if (v === 0) return VolumeX;
    if (v < 0.35) return Volume;
    if (v < 0.65) return Volume1;
    return Volume2;
  }

  function onDismiss(): void {
    const next = (appState.ambiences ?? []).filter((a) => a.id !== ambience.id);
    sendSetAmbiences(next);
  }

  function onVolumeChange(value: number): void {
    const clamped = Math.min(1, Math.max(0, value));
    const entry = appState.ambiences?.find((a) => a.id === ambience.id);
    if (entry) entry.volume = clamped;
    sendSetAmbienceVolume(ambience.id, clamped);
  }

  function onVolumeWheel(e: WheelEvent): void {
    e.preventDefault();
    onVolumeChange(ambience.volume - e.deltaY * 0.001);
  }

  const VolumeIcon = $derived(volumeIcon(ambience.volume));
</script>

<div class="row">
  <div class="row-header">
    <AudioLines class="icon name-icon" size={13} />
    <span class="audio-name">{ambience.label ?? ambience.id}</span>
    <button class="dismiss" onclick={onDismiss} aria-label="Remove {ambience.label ?? ambience.id}">
      <X size={16} />
    </button>
  </div>
  <div class="volume-row" onwheel={onVolumeWheel}>
    <VolumeIcon class="icon vol-icon" size={13} />
    <input
      class="volume-slider"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={ambience.volume}
      oninput={(e) => onVolumeChange((e.currentTarget as HTMLInputElement).valueAsNumber)}
    />
  </div>
</div>

<style>
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

  @media (max-width: 640px) {
    .row {
      padding: var(--space-4);
      gap: var(--space-3);
    }

    .audio-name {
      font-size: var(--text-sm);
    }

    .dismiss {
      padding: var(--space-2);
      margin: calc(-1 * var(--space-2));
    }

    .volume-slider {
      height: 5px;
    }

    .volume-slider::-webkit-slider-thumb {
      width: 14px;
      height: 14px;
    }

    .volume-slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
    }
  }
</style>
