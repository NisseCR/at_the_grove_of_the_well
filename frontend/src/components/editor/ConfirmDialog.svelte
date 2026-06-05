<script lang="ts">
  import { Dialog } from "bits-ui";

  interface Props {
    /** Controls dialog open state — use bind:open from the parent. */
    open: boolean;
    title: string;
    description: string;
    /** Label for the confirm button. Defaults to "Confirm". */
    confirmLabel?: string;
    /** Renders the confirm button in red. Use for destructive actions. */
    destructive?: boolean;
    /** Whether an async action triggered by confirm is in progress. */
    loading?: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  }

  let {
    open = $bindable(),
    title,
    description,
    confirmLabel = "Confirm",
    destructive = false,
    loading = false,
    onconfirm,
    oncancel,
  }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="confirm-overlay" />
    <Dialog.Content class="confirm-panel">
      <Dialog.Title class="confirm-title">{title}</Dialog.Title>
      <Dialog.Description class="confirm-desc">{description}</Dialog.Description>

      <div class="actions">
        <button class="btn-secondary" onclick={oncancel} disabled={loading}>Cancel</button>
        <button
          class={destructive ? "btn-danger" : "btn-primary"}
          onclick={onconfirm}
          disabled={loading}
        >
          {loading ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.confirm-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.confirm-panel) {
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

  :global(.confirm-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  :global(.confirm-desc) {
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
  .btn-primary,
  .btn-danger {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    border: none;
    transition: opacity var(--ease-fast);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .btn-primary {
    background: var(--color-accent);
    color: #000;
  }

  .btn-danger {
    background: #c0392b;
    color: #fff;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-text);
  }

  .btn-primary:hover:not(:disabled),
  .btn-danger:hover:not(:disabled) {
    opacity: 0.85;
  }

  .btn-secondary:disabled,
  .btn-primary:disabled,
  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
