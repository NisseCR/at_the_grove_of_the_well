<script lang="ts">
  import { Dialog, Label } from "bits-ui";
  import type { Ambience } from "@/types/ambience";
  import type { AudioAsset } from "@/types/assets";
  import AssetPickerDialog from "@/components/editor/AssetPickerDialog.svelte";

  interface Props {
    /** Existing ambience to edit, or null when creating. */
    ambience?: Ambience | null;
    open: boolean;
    saving?: boolean;
    onsave: (data: {
      label: string;
      slug: string;
      volume: number;
      loop: boolean;
      audio_asset_id: string | null;
    }) => void;
    oncancel: () => void;
  }

  let {
    ambience = null,
    open = $bindable(),
    saving = false,
    onsave,
    oncancel,
  }: Props = $props();

  const isNew = $derived(!ambience);
  const title = $derived(isNew ? "New ambience" : "Edit ambience");

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------

  let label = $state("");
  let slug = $state("");
  let volume = $state(0.5);
  let loop = $state(true);
  let audioAssetId = $state<string | null>(null);
  let audioAssetLabel = $state<string | null>(null);

  let pickerOpen = $state(false);

  /** Reset form to the current ambience values (or defaults for new). */
  function resetForm() {
    label = ambience?.label ?? "";
    slug = ambience?.slug ?? "";
    volume = ambience?.volume ?? 0.5;
    loop = ambience?.loop ?? true;
    audioAssetId = ambience?.audio_asset_id ?? null;
    audioAssetLabel = ambience?.audio_asset_label ?? null;
  }

  $effect(() => {
    if (open) resetForm();
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /** Submit the form if the label is non-empty. */
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onsave({
      label: label.trim(),
      slug: slug.trim(),
      volume,
      loop,
      audio_asset_id: audioAssetId,
    });
  }

  /** Receives the picked audio asset and updates local state. */
  function handleAudioPick(asset: AudioAsset) {
    audioAssetId = asset.id;
    audioAssetLabel = asset.label;
    pickerOpen = false;
  }

  /** Clears the linked audio asset. */
  function clearAudio() {
    audioAssetId = null;
    audioAssetLabel = null;
  }

  /** Formats a 0–1 volume value as a percentage string. */
  function fmtVolume(v: number): string {
    return `${Math.round(v * 100)}%`;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="ambience-form-overlay" />
    <Dialog.Content class="ambience-form-panel">
      <Dialog.Title class="ambience-form-title">{title}</Dialog.Title>

      <form onsubmit={handleSubmit} class="form">
        <!-- Label -->
        <div class="field">
          <Label.Root for="amb-label" class="field-label">Label</Label.Root>
          <input
            id="amb-label"
            class="input"
            type="text"
            bind:value={label}
            required
            disabled={saving}
            placeholder="e.g. forest rain"
          />
        </div>

        <!-- Slug -->
        <div class="field">
          <Label.Root for="amb-slug" class="field-label">
            Slug <span class="optional">(optional — used in story tags)</span>
          </Label.Root>
          <input
            id="amb-slug"
            class="input"
            type="text"
            bind:value={slug}
            disabled={saving}
            placeholder="e.g. forest-rain"
          />
        </div>

        <!-- Audio asset -->
        <div class="field">
          <Label.Root class="field-label">Audio asset</Label.Root>
          {#if audioAssetLabel}
            <div class="asset-row">
              <span class="asset-label">{audioAssetLabel}</span>
              <button type="button" class="btn-ghost" onclick={() => (pickerOpen = true)} disabled={saving}>
                Change
              </button>
              <button type="button" class="btn-ghost btn-ghost--danger" onclick={clearAudio} disabled={saving}>
                Clear
              </button>
            </div>
          {:else}
            <button type="button" class="btn-pick" onclick={() => (pickerOpen = true)} disabled={saving}>
              Pick audio asset…
            </button>
          {/if}
        </div>

        <!-- Volume -->
        <div class="field">
          <Label.Root for="amb-volume" class="field-label">
            Volume — <span class="value-display">{fmtVolume(volume)}</span>
          </Label.Root>
          <input
            id="amb-volume"
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={volume}
            disabled={saving}
          />
        </div>

        <!-- Loop -->
        <div class="field field--row">
          <input
            id="amb-loop"
            class="checkbox"
            type="checkbox"
            bind:checked={loop}
            disabled={saving}
          />
          <Label.Root for="amb-loop" class="field-label field-label--inline">Loop</Label.Root>
        </div>

        <div class="actions">
          <button type="button" class="btn-secondary" onclick={oncancel} disabled={saving}>Cancel</button>
          <button type="submit" class="btn-primary" disabled={saving || !label.trim()}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

{#if pickerOpen}
  <AssetPickerDialog
    bind:open={pickerOpen}
    types={["audio"]}
    title="Pick audio asset"
    onpick={(asset) => handleAudioPick(asset as AudioAsset)}
    oncancel={() => (pickerOpen = false)}
  />
{/if}

<style>
  :global(.ambience-form-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.ambience-form-panel) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(460px, 90vw);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.ambience-form-title) {
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

  .optional {
    color: var(--color-text-faint);
    font-size: var(--text-xs);
  }

  .value-display {
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  .input {
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .input:focus {
    border-color: var(--color-accent);
  }

  .input:disabled {
    opacity: 0.5;
  }

  .slider {
    width: 100%;
    accent-color: var(--color-accent);
    cursor: pointer;
  }

  .slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--color-accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .asset-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .asset-label {
    flex: 1;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-pick {
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;
    transition: border-color var(--ease-fast), color var(--ease-fast);
  }

  .btn-pick:hover:not(:disabled) {
    border-color: var(--color-text-faint);
    color: var(--color-text-muted);
  }

  .btn-ghost {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
  }

  .btn-ghost:hover:not(:disabled) { color: var(--color-text-muted); }
  .btn-ghost--danger:hover:not(:disabled) { color: #e74c3c; }

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

  .btn-primary:disabled,
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary:hover:not(:disabled),
  .btn-secondary:hover:not(:disabled) {
    opacity: 0.85;
  }
</style>
