<script lang="ts">
  import { Dialog, Label } from "bits-ui";
  import type { LayerProperties } from "@/types/scene";

  const BLEND_MODES = [
    "normal", "multiply", "screen", "overlay", "darken", "lighten",
    "color-dodge", "color-burn", "hard-light", "soft-light",
    "difference", "exclusion", "hue", "saturation", "color", "luminosity",
  ] as const;

  interface Props {
    open: boolean;
    /** Dialog title, e.g. "Background properties" or the layer label. */
    title: string;
    /** The current layer/background properties to pre-fill. */
    properties: LayerProperties;
    /** null for image assets — hides the loop control. */
    assetType: "image" | "video" | null;
    onsave: (props: LayerProperties) => void;
    oncancel: () => void;
  }

  let { open = $bindable(), title, properties, assetType, onsave, oncancel }: Props = $props();

  let loop = $state(true);
  let opacity = $state(1.0);
  let brightness = $state(1.0);
  let grayscale = $state(0.0);
  let blur = $state(0.0);
  let flip = $state(false);
  let blend_mode = $state("normal");

  $effect(() => {
    if (open) {
      loop = properties.loop;
      opacity = properties.opacity;
      brightness = properties.brightness;
      grayscale = properties.grayscale;
      blur = properties.blur;
      flip = properties.flip;
      blend_mode = properties.blend_mode;
    }
  });

  /** Formats a 0–1 value as a percentage. */
  function pct(v: number) {
    return `${Math.round(v * 100)}%`;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    onsave({ loop, opacity, brightness, grayscale, blur, flip, blend_mode });
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="lpd-overlay" />
    <Dialog.Content class="lpd-panel">
      <Dialog.Title class="lpd-title">{title}</Dialog.Title>

      <form onsubmit={handleSubmit} class="form">
        <!-- Opacity -->
        <div class="field">
          <Label.Root for="lpd-opacity" class="field-label">
            Opacity — <span class="value">{pct(opacity)}</span>
          </Label.Root>
          <input id="lpd-opacity" class="slider" type="range" min="0" max="1" step="0.01" bind:value={opacity} />
        </div>

        <!-- Brightness -->
        <div class="field">
          <Label.Root for="lpd-brightness" class="field-label">
            Brightness — <span class="value">{Math.round(brightness * 100)}%</span>
          </Label.Root>
          <input id="lpd-brightness" class="slider" type="range" min="0" max="2" step="0.01" bind:value={brightness} />
        </div>

        <!-- Grayscale -->
        <div class="field">
          <Label.Root for="lpd-grayscale" class="field-label">
            Grayscale — <span class="value">{pct(grayscale)}</span>
          </Label.Root>
          <input id="lpd-grayscale" class="slider" type="range" min="0" max="1" step="0.01" bind:value={grayscale} />
        </div>

        <!-- Blur -->
        <div class="field">
          <Label.Root for="lpd-blur" class="field-label">
            Blur — <span class="value">{blur}px</span>
          </Label.Root>
          <input id="lpd-blur" class="slider" type="range" min="0" max="50" step="1" bind:value={blur} />
        </div>

        <!-- Blend mode -->
        <div class="field">
          <Label.Root for="lpd-blend" class="field-label">Blend mode</Label.Root>
          <select id="lpd-blend" class="select" bind:value={blend_mode}>
            {#each BLEND_MODES as mode}
              <option value={mode}>{mode}</option>
            {/each}
          </select>
        </div>

        <!-- Flip -->
        <div class="field field--row">
          <input id="lpd-flip" class="checkbox" type="checkbox" bind:checked={flip} />
          <Label.Root for="lpd-flip" class="field-label field-label--inline">Flip horizontal</Label.Root>
        </div>

        <!-- Loop (video only) -->
        {#if assetType === "video"}
          <div class="field field--row">
            <input id="lpd-loop" class="checkbox" type="checkbox" bind:checked={loop} />
            <Label.Root for="lpd-loop" class="field-label field-label--inline">Loop</Label.Root>
          </div>
        {/if}

        <div class="actions">
          <button type="button" class="btn-secondary" onclick={oncancel}>Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.lpd-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.lpd-panel) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(420px, 90vw);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.lpd-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field--row {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
  }

  :global(.field-label) {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-family: var(--font-body);
  }

  :global(.field-label--inline) {
    cursor: pointer;
  }

  .value {
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  .slider {
    width: 100%;
    accent-color: var(--color-accent);
    cursor: pointer;
  }

  .select {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    outline: none;
  }

  .select:focus {
    border-color: var(--color-accent);
  }

  .checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--color-accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .btn-primary,
  .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    border: none;
    transition: opacity var(--ease-fast);
  }

  .btn-primary {
    background: var(--color-accent);
    color: #000;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .btn-primary:hover,
  .btn-secondary:hover {
    opacity: 0.85;
  }
</style>
