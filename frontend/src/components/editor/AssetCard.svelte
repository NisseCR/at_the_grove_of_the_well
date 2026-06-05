<script lang="ts">
  import { Tooltip } from "bits-ui";
  import { Pencil, RefreshCw, Trash2, Music, Video, Image, Copy, Check } from "@lucide/svelte";
  import type { AnyAsset, AudioAsset, ImageAsset, VideoAsset } from "@/types/assets";
  import { formatDuration } from "@/lib/utils/format";

  interface Props {
    asset: AnyAsset;
    /** Whether a file replacement is currently in progress for this asset. */
    replacing?: boolean;
    /** Called when the user requests to edit this asset's metadata. */
    onedit: (asset: AnyAsset) => void;
    /** Called when the user requests to delete this asset. */
    ondelete: (asset: AnyAsset) => void;
    /** Called with the replacement file chosen by the user. */
    onreplace: (asset: AnyAsset, file: File) => void;
  }

  let { asset, replacing = false, onedit, ondelete, onreplace }: Props = $props();

  let replaceInput: HTMLInputElement;
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  /** Copies the asset's full CDN URL to the clipboard and briefly shows a confirmation. */
  async function copyPath() {
    await navigator.clipboard.writeText(asset.url);
    copied = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 2000);
  }

  /** Returns true if the asset is an ImageAsset. */
  function isImage(a: AnyAsset): a is ImageAsset {
    return "thumb_src" in a;
  }

  /** Returns true if the asset has a known non-null duration (audio or video). */
  function hasKnownDuration(a: AnyAsset): a is AudioAsset | VideoAsset {
    return "duration" in a && (a as AudioAsset | VideoAsset).duration !== null;
  }

  /** Opens the hidden file input for replacing the asset's file. */
  function openReplaceInput() {
    replaceInput.click();
  }

  /** Forwards the chosen replacement file to the parent. */
  function handleReplaceChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onreplace(asset, file);
    replaceInput.value = "";
  }

  /**
   * Derives the accept attribute for the replace file input from the asset's src extension.
   * AudioAsset always has .ogg src; VideoAsset has .webm; ImageAsset has neither.
   */
  function resolveAccept(a: AnyAsset): string {
    if (isImage(a)) return "image/*";
    if (a.src.endsWith(".ogg")) return "audio/*";
    return "video/*";
  }
</script>

<div class="card">
  <!-- Preview area -->
  <div class="preview">
    {#if isImage(asset) && asset.thumb_url}
      <img class="thumb" src={asset.thumb_url} alt={asset.label} />
    {:else if isImage(asset)}
      <span class="icon"><Image size={32} strokeWidth={1.2} /></span>
    {:else if asset.src.endsWith(".ogg")}
      <span class="icon"><Music size={32} strokeWidth={1.2} /></span>
    {:else}
      <span class="icon"><Video size={32} strokeWidth={1.2} /></span>
    {/if}

    {#if hasKnownDuration(asset)}
      <span class="duration">{formatDuration(asset.duration)}</span>
    {/if}

    <button class="copy-btn" onclick={copyPath} aria-label="Copy asset path" title={asset.src}>
      {#if copied}
        <Check size={12} />
      {:else}
        <Copy size={12} />
      {/if}
    </button>
  </div>

  <!-- Metadata -->
  <div class="meta">
    <span class="label" title={asset.label}>{asset.label}</span>
    {#if asset.artist}
      <span class="artist" title={asset.artist}>{asset.artist}</span>
    {/if}
  </div>

  <!-- Actions -->
  <div class="actions">
    <Tooltip.Provider delayDuration={400}>
      <Tooltip.Root>
        <Tooltip.Trigger class="action-btn" onclick={() => onedit(asset)} aria-label="Edit">
          <Pencil size={13} />
        </Tooltip.Trigger>
        <Tooltip.Content class="tooltip">Edit</Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger
          class={replacing ? "action-btn spinning" : "action-btn"}
          onclick={openReplaceInput}
          disabled={replacing}
          aria-label="Replace file"
        >
          <RefreshCw size={13} />
        </Tooltip.Trigger>
        <Tooltip.Content class="tooltip">{replacing ? "Replacing…" : "Replace file"}</Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger
          class="action-btn action-btn--danger"
          onclick={() => ondelete(asset)}
          disabled={replacing}
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </Tooltip.Trigger>
        <Tooltip.Content class="tooltip">Delete</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
</div>

<input
  bind:this={replaceInput}
  type="file"
  accept={resolveAccept(asset)}
  onchange={handleReplaceChange}
  style="display:none"
/>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    overflow: hidden;
    transition: border-color var(--ease-fast);
  }

  .card:hover {
    border-color: var(--color-text-faint);
  }

  .preview {
    position: relative;
    aspect-ratio: 16 / 9;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .icon {
    opacity: 0.4;
    display: flex;
  }

  .copy-btn {
    position: absolute;
    top: var(--space-1);
    right: var(--space-1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: var(--radius-sm, 4px);
    background: rgba(0, 0, 0, 0.55);
    border: none;
    color: #fff;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--ease-fast);
  }

  .card:hover .copy-btn {
    opacity: 1;
  }

  .copy-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .duration {
    position: absolute;
    bottom: var(--space-1);
    right: var(--space-2);
    font-size: var(--text-xs);
    font-family: var(--font-body);
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .meta {
    padding: var(--space-2) var(--space-3);
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .label {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .artist {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-2);
    border-top: 1px solid var(--color-border);
  }

  :global(.action-btn) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1) 0;
    color: var(--color-text-muted);
    background: none;
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    transition:
      background var(--ease-fast),
      color var(--ease-fast);
  }

  :global(.action-btn:hover:not(:disabled)) {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text);
  }

  :global(.action-btn:disabled) {
    opacity: 0.4;
    cursor: not-allowed;
  }

  :global(.action-btn--danger:hover:not(:disabled)) {
    background: rgba(192, 57, 43, 0.2);
    color: #e74c3c;
  }

  :global(.action-btn.spinning svg) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  :global(.tooltip) {
    background: #2a2838;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    font-family: var(--font-body);
    padding: var(--space-1) var(--space-2);
    z-index: 60;
  }
</style>
