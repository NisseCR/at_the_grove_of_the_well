<script lang="ts">
  import { Dialog, Label } from "bits-ui";
  import type { AnyAsset } from "@/types/assets";

  interface Props {
    /** The asset being edited. */
    asset: AnyAsset;
    /** Controls dialog open state — use bind:open from the parent. */
    open: boolean;
    /** Whether a save request is in flight. */
    saving?: boolean;
    /** Called with the updated fields when the user confirms. */
    onsave: (patch: { label: string; artist: string }) => void;
    /** Called when the dialog is dismissed without saving. */
    oncancel: () => void;
  }

  let { asset, open = $bindable(), saving = false, onsave, oncancel }: Props = $props();

  let label = $state("");
  let artist = $state("");

  /** Resets form fields to the current asset values. */
  function resetForm() {
    label = asset.label;
    artist = asset.artist ?? "";
  }

  /** Submits the form if label is non-empty, otherwise prevents submission. */
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onsave({ label: label.trim(), artist: artist.trim() });
  }

  /** Closes the dialog and resets the form. */
  function handleCancel() {
    resetForm();
    oncancel();
  }

  $effect(() => {
    if (open) resetForm();
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="overlay" />
    <Dialog.Content class="dialog">
      <Dialog.Title class="dialog-title">Edit asset</Dialog.Title>
      <Dialog.Description class="dialog-desc">
        Update the label and artist for <em>{asset.label}</em>.
      </Dialog.Description>

      <form onsubmit={handleSubmit} class="form">
        <div class="field">
          <Label.Root for="edit-label" class="field-label">Label</Label.Root>
          <input
            id="edit-label"
            class="input"
            type="text"
            bind:value={label}
            required
            disabled={saving}
          />
        </div>

        <div class="field">
          <Label.Root for="edit-artist" class="field-label">Artist <span class="optional">(optional)</span></Label.Root>
          <input
            id="edit-artist"
            class="input"
            type="text"
            bind:value={artist}
            disabled={saving}
          />
        </div>

        <div class="actions">
          <button type="button" class="btn-secondary" onclick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={saving || !label.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.dialog) {
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

  :global(.dialog-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  :global(.dialog-desc) {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
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

  .optional {
    color: var(--color-text-faint);
    font-size: var(--text-xs);
  }

  .input {
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
    transition: opacity var(--ease-fast);
    border: none;
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

  .btn-primary:hover:not(:disabled) {
    opacity: 0.85;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-text);
  }
</style>
