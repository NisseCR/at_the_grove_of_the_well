<script lang="ts">
  import { Music, Volume, Volume1, Volume2, VolumeX, X } from "@lucide/svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetPlaylist, sendSetMusicVolume } from "@/lib/services/transport";

  function volumeIcon(v: number) {
    if (v === 0) return VolumeX;
    if (v < 0.35) return Volume;
    if (v < 0.65) return Volume1;
    return Volume2;
  }

  function onVolumeChange(value: number): void {
    const clamped = Math.min(1, Math.max(0, value));
    if (appState.music) appState.music.volume = clamped;
    sendSetMusicVolume(clamped);
  }

  function onVolumeWheel(e: WheelEvent): void {
    e.preventDefault();
    onVolumeChange((appState.music?.volume ?? 0.5) - e.deltaY * 0.001);
  }

  const volume = $derived(appState.music!.volume);
  const VolumeIcon = $derived(volumeIcon(volume));
</script>

<div class="row">
  <div class="row-header">
    <Music class="icon name-icon" size={13} />
    <span class="audio-name">{appState.music!.playlistId}</span>
    <button class="dismiss" onclick={() => sendSetPlaylist(null)} aria-label="Stop music">
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
      value={volume}
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
</style>
