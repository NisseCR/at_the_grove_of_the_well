<script lang="ts">
  import { ImageIcon, Music, Pencil, Video } from "@lucide/svelte";
  import type { AnyAsset, AssetType, ImageAsset } from "@/types/assets";

  interface Props {
    asset: AnyAsset;
    type: AssetType;
    /** Called when the user clicks the edit button. Parent opens the edit modal. */
    onEdit: (asset: AnyAsset) => void;
  }

  const { asset, type, onEdit }: Props = $props();

  const thumbUrl = $derived(type === "image" ? (asset as ImageAsset).thumb_url : null);
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

    <button class="edit-btn" onclick={() => onEdit(asset)} title="Edit">
      <Pencil size={12} />
    </button>
  </div>

  <div class="info">
    <span class="label" title={asset.label}>{asset.label}</span>
  </div>
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
    border-color: var(--color-border-hover, var(--color-accent));
  }

  .preview {
    position: relative;
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

  .edit-btn {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-xs, 3px);
    background: rgba(0, 0, 0, 0.6);
    color: var(--color-text-muted);
    opacity: 0;
    transition:
      opacity var(--ease-fast),
      color var(--ease-fast);
  }

  .card:hover .edit-btn {
    opacity: 1;
  }

  .edit-btn:hover {
    color: var(--color-text);
  }

  .info {
    padding: var(--space-2) var(--space-3);
  }

  .label {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
