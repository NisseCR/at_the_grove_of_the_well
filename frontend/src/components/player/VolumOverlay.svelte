<script lang="ts">
  import * as Tone from "tone";
  import { Volume2, VolumeX } from "@lucide/svelte";
  import { Slider } from "bits-ui";

  let volume = $state(1);
  let prevVolume = $state(1);
  let visible = $state(false);
  let hovered = false;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const pct = $derived(Math.round(volume * 100));

  $effect(() => {
    const db = volume === 0 ? -Infinity : 20 * Math.log10(volume);
    Tone.getDestination().volume.value = db;
  });

  /**
   * Show the overlay and reset the auto-hide timer.
   * Called on window mousemove so any cursor activity keeps the HUD visible.
   */
  function show() {
    visible = true;
    if (hideTimer) clearTimeout(hideTimer);
    if (!hovered) {
      hideTimer = setTimeout(() => {
        visible = false;
      }, 3000);
    }
  }

  /**
   * Cancel the auto-hide timer while the user is interacting with the overlay.
   */
  function keepAlive() {
    hovered = true;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  /**
   * Restart the auto-hide timer when the cursor leaves the overlay.
   */
  function resumeHide() {
    hovered = false;
    hideTimer = setTimeout(() => {
      visible = false;
    }, 3000);
  }

  /**
   * Adjust volume on scroll wheel. Normalises deltaY to a fixed ±5% step so
   * behaviour is consistent across browsers and devices.
   */
  function onwheel(e: WheelEvent) {
    const step = e.deltaY > 0 ? -0.05 : 0.05;
    volume = Math.max(0, Math.min(1, volume + step));
    show();
  }

  /**
   * Toggle mute. Remembers the previous volume so unmuting restores it.
   */
  function toggleMute() {
    if (volume > 0) {
      prevVolume = volume;
      volume = 0;
    } else {
      volume = prevVolume || 1;
    }
  }
</script>

<svelte:window onmousemove={show} />

<div class="wheel-zone" {onwheel}>
  <div
    class="overlay"
    class:visible
    onmouseenter={keepAlive}
    onmouseleave={resumeHide}
    role="group"
    aria-label="Volume control"
  >
    <button
      class="mute-btn"
      onclick={toggleMute}
      aria-label={volume === 0 ? "Unmute" : "Mute"}
    >
      {#if volume === 0}
        <VolumeX size={14} />
      {:else}
        <Volume2 size={14} />
      {/if}
    </button>

    <Slider.Root
      class="vol-slider"
      type="single"
      bind:value={volume}
      min={0}
      max={1}
      step={0.01}
      aria-label="Master volume"
    >
      {#snippet children({ thumbItems })}
        <Slider.Range class="vol-range" />
        {#each thumbItems as thumb}
          <Slider.Thumb class="vol-thumb" index={thumb.index} />
        {/each}
      {/snippet}
    </Slider.Root>

    <span class="label">{pct}%</span>
  </div>
</div>

<style>
  .wheel-zone {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 50;
    padding: 80px 24px 24px 80px;
  }

  .overlay {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--ease-base);
  }

  .overlay.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .mute-btn {
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
    transition: color var(--ease-fast);
  }

  .mute-btn:hover {
    color: var(--color-text);
  }

  :global(.vol-slider) {
    position: relative;
    display: flex;
    align-items: center;
    width: 80px;
    height: 16px;
    cursor: pointer;
  }

  :global(.vol-slider)::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--color-border);
    pointer-events: none;
  }

  :global(.vol-range) {
    height: 1px;
    background: var(--color-accent);
  }

  :global(.vol-thumb) {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent);
    top: calc(50% - 4px);
    outline: none;
    transition: background var(--ease-fast);
  }

  :global(.vol-thumb:hover),
  :global(.vol-thumb:focus-visible) {
    background: var(--color-text);
  }

  .label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    width: 4ch;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
