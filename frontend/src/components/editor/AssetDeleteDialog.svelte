<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { AnyAsset } from "@/types/assets";

  interface Props {
    /** The asset pending deletion. */
    asset: AnyAsset;
    /** Controls dialog open state — use bind:open from the parent. */
    open: boolean;
    /** Whether a delete request is in flight. */
    deleting?: boolean;
    /** Called when the user confirms the deletion. */
    onconfirm: () => void;
    /** Called when the user cancels. */
    oncancel: () => void;
  }

  let { asset, open = $bindable(), deleting = false, onconfirm, oncancel }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="overlay" />
    <Dialog.Content class="dialog">
      <Dialog.Title class="dialog-title">Delete asset</Dialog.Title>
      <Dialog.Description class="dialog-desc">
        Are you sure you want to delete <em>{asset.label}</em>? This removes the file from R2 and
        cannot be undone.
      </Dialog.Description>

      <div class="actions">
        <button class="btn-secondary" onclick={oncancel} disabled={deleting}>Cancel</button>
        <button class="btn-danger" onclick={onconfirm} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
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
    width: min(400px, 90vw);
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
    line-height: 1.5;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .btn-secondary,
  .btn-danger {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    transition: opacity var(--ease-fast);
    border: none;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .btn-danger {
    background: #c0392b;
    color: #fff;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-text);
  }

  .btn-danger:hover:not(:disabled) {
    opacity: 0.85;
  }

  .btn-secondary:disabled,
  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
