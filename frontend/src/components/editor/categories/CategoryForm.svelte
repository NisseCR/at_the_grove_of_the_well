<script lang="ts">
  import { Dialog, Label } from "bits-ui";
  import type { ImageAsset } from "@/types/assets";
  import AssetPickerDialog from "@/components/editor/shared/AssetPickerDialog.svelte";

  interface CategoryData {
    label: string;
    order: number;
    thumb_src?: string | null;
  }

  interface Props {
    /** Existing entity to edit, or null/undefined when creating. */
    category?: CategoryData | null;
    open: boolean;
    saving?: boolean;
    /** Shown in the dialog title: "New {entityLabel}" / "Edit {entityLabel}". */
    entityLabel?: string;
    /** When true, shows the thumbnail image picker. */
    withThumbnail?: boolean;
    onsave: (data: {
      label: string;
      display_order: number;
      thumb_id: string | null;
    }) => void;
    oncancel: () => void;
  }

  let {
    category = null,
    open = $bindable(),
    saving = false,
    entityLabel = "category",
    withThumbnail = false,
    onsave,
    oncancel,
  }: Props = $props();

  const isNew = $derived(!category);
  const title = $derived(`${isNew ? "New" : "Edit"} ${entityLabel}`);

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------

  let label = $state("");
  let displayOrder = $state(0);
  let thumbId = $state<string | null>(null);
  let thumbLabel = $state<string | null>(null);

  let pickerOpen = $state(false);

  /** Reset to current values (or defaults for new). */
  function resetForm() {
    label = category?.label ?? "";
    displayOrder = category?.order ?? 0;
    thumbId = null;
    thumbLabel = category?.thumb_src ? "Current thumbnail" : null;
  }

  $effect(() => {
    if (open) resetForm();
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /** Submit if label is non-empty. */
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onsave({
      label: label.trim(),
      display_order: displayOrder,
      thumb_id: thumbId,
    });
  }

  /** Stores the picked image as the new thumbnail. */
  function handleThumbPick(asset: ImageAsset) {
    thumbId = asset.id;
    thumbLabel = asset.label;
    pickerOpen = false;
  }

  /** Removes the thumbnail selection (empty string = explicit clear). */
  function clearThumb() {
    thumbId = "";
    thumbLabel = null;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="cat-form-overlay" />
    <Dialog.Content class="cat-form-panel">
      <Dialog.Title class="cat-form-title">{title}</Dialog.Title>

      <form onsubmit={handleSubmit} class="form">
        <!-- Label -->
        <div class="field">
          <Label.Root for="cat-label" class="field-label">Label</Label.Root>
          <input
            id="cat-label"
            class="input"
            type="text"
            bind:value={label}
            required
            disabled={saving}
            placeholder="e.g. Nature"
          />
        </div>

        <!-- Display order -->
        <div class="field">
          <Label.Root for="cat-order" class="field-label"
            >Display order</Label.Root
          >
          <input
            id="cat-order"
            class="input"
            type="number"
            min="0"
            bind:value={displayOrder}
            disabled={saving}
          />
        </div>

        <!-- Thumbnail (optional) -->
        {#if withThumbnail}
          <div class="field">
            <Label.Root class="field-label">Thumbnail image</Label.Root>
            {#if thumbLabel}
              <div class="asset-row">
                <span class="asset-label">{thumbLabel}</span>
                <button
                  type="button"
                  class="btn-ghost"
                  onclick={() => (pickerOpen = true)}
                  disabled={saving}
                >
                  Change
                </button>
                <button
                  type="button"
                  class="btn-ghost btn-ghost--danger"
                  onclick={clearThumb}
                  disabled={saving}
                >
                  Clear
                </button>
              </div>
            {:else}
              <button
                type="button"
                class="btn-pick"
                onclick={() => (pickerOpen = true)}
                disabled={saving}
              >
                Pick thumbnail…
              </button>
            {/if}
          </div>
        {/if}

        <div class="actions">
          <button
            type="button"
            class="btn-secondary"
            onclick={oncancel}
            disabled={saving}>Cancel</button
          >
          <button
            type="submit"
            class="btn-primary"
            disabled={saving || !label.trim()}
          >
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
    types={["image"]}
    title="Pick thumbnail"
    onpick={(asset) => handleThumbPick(asset as ImageAsset)}
    oncancel={() => (pickerOpen = false)}
  />
{/if}

<style>
  :global(.cat-form-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.cat-form-panel) {
    position: fixed;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
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

  :global(.cat-form-title) {
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

  :global(.field-label) {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-family: var(--font-body);
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
    transition:
      border-color var(--ease-fast),
      color var(--ease-fast);
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

  .btn-ghost:hover:not(:disabled) {
    color: var(--color-text-muted);
  }
  .btn-ghost--danger:hover:not(:disabled) {
    color: #e74c3c;
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
