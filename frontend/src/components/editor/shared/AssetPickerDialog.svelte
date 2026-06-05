<script lang="ts">
  import { Dialog, Tabs } from "bits-ui";
  import { Image, Music, Video } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import { assetApiClient } from "@/lib/services/assetApiClient";
  import type {
    AnyAsset,
    AssetType,
    AudioAsset,
    ImageAsset,
    VideoAsset,
  } from "@/types/assets";
  import { formatDuration } from "@/lib/utils/format";
  import SearchInput from "@/components/editor/shared/SearchInput.svelte";

  interface Props {
    /** Controls dialog open state — use bind:open from the parent. */
    open: boolean;
    /** Which asset types to show. Order determines tab order. */
    types: AssetType[];
    title?: string;
    /** Called with the chosen asset and its type; dialog closes automatically. */
    onpick: (asset: AnyAsset, type: AssetType) => void;
    oncancel: () => void;
  }

  let {
    open = $bindable(),
    types,
    title = "Pick an asset",
    onpick,
    oncancel,
  }: Props = $props();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let activeType = $state<AssetType>("image");
  let searchQuery = $state("");

  let images = $state<ImageAsset[]>([]);
  let audio = $state<AudioAsset[]>([]);
  let video = $state<VideoAsset[]>([]);
  const loaded = new Set<AssetType>();
  let loadingType = $state(false);

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  /** Fetches assets of the given type if not already cached. */
  async function loadType(type: AssetType) {
    if (loaded.has(type)) return;
    loadingType = true;
    try {
      if (type === "image") images = await assetApiClient.listImages();
      else if (type === "audio") audio = await assetApiClient.listAudio();
      else video = await assetApiClient.listVideo();
      loaded.add(type);
    } catch {
      toast.error(`Failed to load ${type} assets`);
    } finally {
      loadingType = false;
    }
  }

  /** Returns the raw asset list for the currently active type. */
  function currentAssets(): AnyAsset[] {
    if (activeType === "image") return images;
    if (activeType === "audio") return audio;
    return video;
  }

  /**
   * Returns assets filtered by the current search query.
   * Matches label and artist case-insensitively.
   */
  function filteredAssets(): AnyAsset[] {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentAssets();
    return currentAssets().filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.artist?.toLowerCase().includes(q) ?? false),
    );
  }

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  /** Switches to a different asset type tab and fetches its data. */
  function handleTypeChange(type: string) {
    activeType = type as AssetType;
    searchQuery = "";
    loadType(activeType);
  }

  /** Selects an asset and closes the dialog. */
  function handlePick(asset: AnyAsset) {
    onpick(asset, activeType);
    open = false;
  }

  // Reset and load whenever the dialog opens.
  $effect(() => {
    if (open) {
      activeType = types[0];
      searchQuery = "";
      loadType(types[0]);
    }
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Returns true if the asset is an ImageAsset (has thumb_src but no duration). */
  function isImage(a: AnyAsset): a is ImageAsset {
    return "thumb_src" in a && !("duration" in a);
  }

  /** Returns true if the asset is a VideoAsset (has both thumb_src and duration). */
  function isVideo(a: AnyAsset): a is VideoAsset {
    return "thumb_src" in a && "duration" in a;
  }

  /** Returns true if the asset has a known non-null duration. */
  function hasKnownDuration(a: AnyAsset): a is AudioAsset | VideoAsset {
    return "duration" in a && (a as AudioAsset | VideoAsset).duration !== null;
  }

  const TAB_LABEL: Record<AssetType, string> = {
    image: "Images",
    audio: "Audio",
    video: "Video",
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="picker-overlay" />
    <Dialog.Content class="picker-panel">
      <Dialog.Title class="picker-title">{title}</Dialog.Title>

      <Tabs.Root
        value={activeType}
        onValueChange={handleTypeChange}
        class="picker-tabs"
      >
        {#if types.length > 1}
          <Tabs.List class="picker-tab-list">
            {#each types as type}
              <Tabs.Trigger value={type} class="picker-tab"
                >{TAB_LABEL[type]}</Tabs.Trigger
              >
            {/each}
          </Tabs.List>
        {/if}
      </Tabs.Root>

      <SearchInput
        bind:value={searchQuery}
        placeholder="Search by label or artist…"
      />

      <div class="picker-list">
        {#if loadingType}
          <p class="picker-status">Loading…</p>
        {:else if currentAssets().length === 0}
          <p class="picker-status">
            No {TAB_LABEL[activeType].toLowerCase()} uploaded yet.
          </p>
        {:else if filteredAssets().length === 0}
          <p class="picker-status">No results for "{searchQuery}".</p>
        {:else}
          {#each filteredAssets() as asset (asset.id)}
            <button class="picker-item" onclick={() => handlePick(asset)}>
              <div class="picker-thumb">
                {#if isImage(asset) && asset.thumb_url}
                  <img src={asset.thumb_url} alt={asset.label} />
                {:else if isVideo(asset) && asset.thumb_url}
                  <img src={asset.thumb_url} alt={asset.label} />
                {:else if isImage(asset)}
                  <Image size={18} strokeWidth={1.2} />
                {:else if isVideo(asset)}
                  <Video size={18} strokeWidth={1.2} />
                {:else}
                  <Music size={18} strokeWidth={1.2} />
                {/if}
              </div>

              <div class="picker-meta">
                <span class="picker-label">{asset.label}</span>
                {#if asset.artist}
                  <span class="picker-artist">{asset.artist}</span>
                {/if}
              </div>

              {#if hasKnownDuration(asset)}
                <span class="picker-duration"
                  >{formatDuration(asset.duration)}</span
                >
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      <div class="picker-actions">
        <button class="btn-secondary" onclick={oncancel}>Cancel</button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.picker-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.picker-panel) {
    position: fixed;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(560px, 90vw);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.picker-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  :global(.picker-tabs) {
    display: contents;
  }

  :global(.picker-tab-list) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border);
  }

  :global(.picker-tab) {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    padding: var(--space-1) var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    cursor: pointer;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  :global(.picker-tab:hover) {
    color: var(--color-text);
  }

  :global(.picker-tab[data-state="active"]) {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  .picker-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
  }

  .picker-status {
    color: var(--color-text-faint);
    font-size: var(--text-sm);
    font-style: italic;
    padding: var(--space-4) 0;
  }

  .picker-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border-radius: var(--radius-sm, 4px);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background var(--ease-fast);
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  .picker-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .picker-thumb {
    width: 64px;
    aspect-ratio: 16 / 9;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: var(--color-text-faint);
  }

  .picker-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .picker-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .picker-label {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
  }

  .picker-artist {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
  }

  .picker-duration {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    flex-shrink: 0;
  }

  .picker-actions {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
  }

  .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition:
      background var(--ease-fast),
      color var(--ease-fast);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-text);
  }
</style>
