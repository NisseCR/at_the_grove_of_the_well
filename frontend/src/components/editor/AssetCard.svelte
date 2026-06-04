<script lang="ts">
  import { ImageIcon, Music, Pencil, Trash2, Upload, Video } from "@lucide/svelte";
  import type { AnyAsset, AssetType, ImageAsset } from "@/types/assets";

  interface Props {
    asset: AnyAsset;
    type: AssetType;
    onPatchLabel: (id: string, label: string) => void;
    onReplace: (id: string, file: File) => void;
    onDelete: (id: string) => void;
  }

  const { asset, type, onPatchLabel, onReplace, onDelete }: Props = $props();

  let editing = $state(false);
  let confirming = $state(false);
  let labelInput = $state(asset.label);
  let fileInput: HTMLInputElement;

  const accept = type === "image" ? "image/*" : type === "audio" ? "audio/*" : "video/webm";
  const thumbUrl = $derived(type === "image" ? (asset as ImageAsset).thumb_url : null);

  function startEdit() {
    labelInput = asset.label;
    editing = true;
  }

  function commitEdit() {
    editing = false;
    const trimmed = labelInput.trim();
    if (trimmed && trimmed !== asset.label) onPatchLabel(asset.id, trimmed);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") editing = false;
  }

  function onReplaceClick() {
    fileInput.click();
  }

  function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onReplace(asset.id, file);
    (e.target as HTMLInputElement).value = "";
  }
</script>

<div class="card">
  <div class="preview">
    {#if thumbUrl}
      <img src={thumbUrl} alt={asset.label} />
    {:else if type === "audio"}
      <Music size={22} class="preview-icon" />
    {:else if type === "video"}
      <Video size={22} class="preview-icon" />
    {:else}
      <ImageIcon size={22} class="preview-icon" />
    {/if}
  </div>

  <div class="info">
    {#if editing}
      <input
        class="label-input"
        bind:value={labelInput}
        onblur={commitEdit}
        onkeydown={onKeyDown}
        autofocus
      />
    {:else}
      <span class="label" title={asset.label}>{asset.label}</span>
    {/if}

    <div class="actions">
      <button class="action-btn" onclick={startEdit} title="Rename">
        <Pencil size={12} />
      </button>
      <button class="action-btn" onclick={onReplaceClick} title="Replace file">
        <Upload size={12} />
      </button>
      {#if confirming}
        <button class="action-btn danger" onclick={() => onDelete(asset.id)}>Delete</button>
        <button class="action-btn" onclick={() => (confirming = false)}>×</button>
      {:else}
        <button class="action-btn" onclick={() => (confirming = true)} title="Delete">
          <Trash2 size={12} />
        </button>
      {/if}
    </div>
  </div>

  <input type="file" bind:this={fileInput} {accept} onchange={onFileChange} hidden />
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-glass);
    overflow: hidden;
    transition: border-color var(--ease-fast);
  }

  .card:hover {
    border-color: var(--color-border-hover, var(--color-border));
  }

  .preview {
    aspect-ratio: 16 / 10;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :global(.preview-icon) {
    color: var(--color-text-faint);
  }

  .info {
    padding: var(--space-2) var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .label-input {
    font-size: var(--text-xs);
    color: var(--color-text);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-accent);
    outline: none;
    width: 100%;
    padding: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .action-btn {
    display: flex;
    align-items: center;
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    padding: var(--space-1);
    border-radius: var(--radius-xs, 2px);
    transition: color var(--ease-fast);
  }

  .action-btn:hover {
    color: var(--color-text);
  }

  .action-btn.danger {
    color: var(--color-error, #e05);
  }

  .action-btn.danger:hover {
    color: var(--color-error-bright, #f36);
  }
</style>
