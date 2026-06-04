<script lang="ts">
  import { Upload, X } from "@lucide/svelte";
  import { portal } from "@/lib/actions/portal";
  import type { AnyAsset, AssetType, ImageAsset } from "@/types/assets";

  interface Props {
    asset: AnyAsset;
    type: AssetType;
    /** Called when the user saves a new label. Modal stays open. */
    onPatchLabel: (id: string, label: string) => void;
    /** Called when the user selects a replacement file. Modal stays open. */
    onReplace: (id: string, file: File) => void;
    /** Called when the user confirms deletion. Modal closes after this. */
    onDelete: (id: string) => void;
    onClose: () => void;
  }

  const { asset, type, onPatchLabel, onReplace, onDelete, onClose }: Props = $props();

  let label = $state(asset.label);
  let confirming = $state(false);
  let fileInput: HTMLInputElement;

  const accept = type === "image" ? "image/*" : type === "audio" ? "audio/*" : "video/webm";
  const thumbUrl = $derived(type === "image" ? (asset as ImageAsset).thumb_url : null);

  /** Save the edited label if changed. Modal stays open. */
  function handleSaveLabel() {
    const trimmed = label.trim();
    if (trimmed && trimmed !== asset.label) onPatchLabel(asset.id, trimmed);
  }

  /** Trigger the hidden file input for replacing the asset file. */
  function handleReplaceClick() {
    fileInput.click();
  }

  /** Handle file selection — calls onReplace. Modal stays open. */
  function handleFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onReplace(asset.id, file);
    (e.target as HTMLInputElement).value = "";
  }

  /** Confirm deletion — calls onDelete and closes the modal. */
  function handleDelete() {
    onDelete(asset.id);
    onClose();
  }

  /** Close modal when clicking the backdrop outside the card. */
  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  /** Close modal on Escape key. */
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<div
  class="backdrop"
  use:portal
  onclick={onBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-label="Edit {asset.label}"
>
  <div class="modal">

    <div class="header">
      <span class="header-name">{asset.label}</span>
      <button class="close-btn" onclick={onClose} aria-label="Close">
        <X size={14} />
      </button>
    </div>

    {#if thumbUrl}
      <div class="thumb">
        <img src={thumbUrl} alt={asset.label} />
      </div>
    {/if}

    <div class="body">
      <input
        class="label-input"
        bind:value={label}
        onkeydown={(e) => e.key === "Enter" && handleSaveLabel()}
        aria-label="Asset label"
      />
      <p class="src">{asset.src}</p>
    </div>

    <div class="footer">
      {#if confirming}
        <div class="confirm">
          <span class="confirm-text">Delete permanently?</span>
          <button class="btn-ghost-danger" onclick={handleDelete}>Yes, delete</button>
          <button class="btn-ghost" onclick={() => (confirming = false)}>Cancel</button>
        </div>
      {:else}
        <button class="btn-ghost-danger" onclick={() => (confirming = true)}>Delete</button>
        <div class="footer-right">
          <button class="btn-outline" onclick={handleReplaceClick}>
            <Upload size={12} />
            Replace
          </button>
          <button class="btn-accent" onclick={handleSaveLabel}>Save</button>
        </div>
      {/if}
    </div>

  </div>

  <input type="file" bind:this={fileInput} {accept} onchange={handleFileChange} hidden />
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
  }

  .modal {
    width: 100%;
    max-width: 420px;
    background: var(--color-surface, #1a1625);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 6px);
    overflow: hidden;
  }

  /* Header */

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
  }

  .header-name {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--color-text-faint);
    padding: var(--space-1);
    margin-left: var(--space-3);
    border-radius: var(--radius-xs, 3px);
    transition: color var(--ease-fast);
  }

  .close-btn:hover {
    color: var(--color-text);
  }

  /* Thumbnail */

  .thumb {
    width: 100%;
    height: 160px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.4);
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Body */

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-5);
    border-top: 1px solid var(--color-border);
  }

  .label-input {
    width: 100%;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-3) var(--space-3);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .label-input:focus {
    border-color: var(--color-accent);
  }

  .src {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 var(--space-1);
  }

  /* Footer */

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--color-border);
    gap: var(--space-3);
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .confirm {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
  }

  .confirm-text {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    flex: 1;
  }

  /* Button variants */

  .btn-ghost {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    transition: color var(--ease-fast);
  }

  .btn-ghost:hover {
    color: var(--color-text);
  }

  .btn-ghost-danger {
    font-size: var(--text-xs);
    color: var(--color-error, #c03);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    transition: color var(--ease-fast);
  }

  .btn-ghost-danger:hover {
    color: #ff4466;
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .btn-outline:hover {
    color: var(--color-text);
    border-color: var(--color-text-muted);
  }

  .btn-accent {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-bg, #000);
    background: var(--color-accent);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-4);
    transition: opacity var(--ease-fast);
  }

  .btn-accent:hover {
    opacity: 0.85;
  }
</style>
