<script lang="ts">
  import { Tabs, ToggleGroup, Select } from "bits-ui";
  import { Search, ChevronDown } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import { assetApiClient } from "@/lib/services/assetApiClient";
  import type { AnyAsset, AudioAsset, ImageAsset, VideoAsset } from "@/types/assets";
  import AssetCard from "@/components/editor/AssetCard.svelte";
  import AssetUploadZone from "@/components/editor/AssetUploadZone.svelte";
  import AssetEditDialog from "@/components/editor/AssetEditDialog.svelte";
  import AssetDeleteDialog from "@/components/editor/AssetDeleteDialog.svelte";
  import { labelFromFilename } from "@/lib/utils/format";

  type AssetTab = "images" | "audio" | "video";

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let activeTab = $state<AssetTab>("images");

  let images = $state<ImageAsset[]>([]);
  let audio = $state<AudioAsset[]>([]);
  let video = $state<VideoAsset[]>([]);

  /** Tracks which tabs have already been fetched to avoid redundant requests. */
  const loaded = new Set<AssetTab>();

  let loadingTab = $state(false);
  let uploading = $state(false);
  let saving = $state(false);
  let deleting = $state(false);
  /** ID of the asset currently being replaced, to lock its card during the request. */
  let replacingId = $state<string | null>(null);
  /** Loudness normalisation mode — only relevant when uploading audio. */
  let normMode = $state<"music" | "ambience">("music");
  /** Free-text filter applied to label and artist of the current tab's assets. */
  let searchQuery = $state("");

  type SortKey =
    | "label-asc"
    | "label-desc"
    | "artist-asc"
    | "artist-desc"
    | "created-desc"
    | "created-asc"
    | "updated-desc";

  /** Active sort order — persists across tab switches. */
  let sortBy = $state<SortKey>("label-asc");

  const SORT_LABELS: Record<SortKey, string> = {
    "label-asc":    "Label A→Z",
    "label-desc":   "Label Z→A",
    "artist-asc":   "Artist A→Z",
    "artist-desc":  "Artist Z→A",
    "created-desc": "Newest first",
    "created-asc":  "Oldest first",
    "updated-desc": "Recently updated",
  };

  /** The asset whose edit dialog is open. */
  let editTarget = $state<AnyAsset | null>(null);
  let editOpen = $state(false);

  /** The asset whose delete confirm dialog is open. */
  let deleteTarget = $state<AnyAsset | null>(null);
  let deleteOpen = $state(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /** Fetches the asset list for the given tab if it hasn't been loaded yet. */
  async function loadTab(tab: AssetTab) {
    if (loaded.has(tab)) return;
    loadingTab = true;
    try {
      if (tab === "images") images = await assetApiClient.listImages();
      else if (tab === "audio") audio = await assetApiClient.listAudio();
      else video = await assetApiClient.listVideo();
      loaded.add(tab);
    } catch {
      toast.error(`Failed to load ${tab}`);
    } finally {
      loadingTab = false;
    }
  }

  /** Switches the active tab, clears the search query, and triggers a fetch if needed. */
  function handleTabChange(tab: string) {
    activeTab = tab as AssetTab;
    searchQuery = "";
    loadTab(activeTab);
  }

  $effect(() => {
    loadTab("images");
  });

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  /** Uploads a list of files for the currently active tab. */
  async function handleUpload(files: File[]) {
    uploading = true;
    try {
      if (activeTab === "images") {
        const uploaded =
          files.length === 1
            ? [await assetApiClient.uploadImage(files[0], labelFromFilename(files[0].name))]
            : await assetApiClient.uploadImagesBulk(files);
        images = [...images, ...uploaded].sort((a, b) => a.label.localeCompare(b.label));
      } else if (activeTab === "audio") {
        const uploaded =
          files.length === 1
            ? [await assetApiClient.uploadAudio(files[0], labelFromFilename(files[0].name), undefined, normMode)]
            : await assetApiClient.uploadAudioBulk(files, normMode);
        audio = [...audio, ...uploaded].sort((a, b) => a.label.localeCompare(b.label));
      } else {
        const uploaded =
          files.length === 1
            ? [await assetApiClient.uploadVideo(files[0], labelFromFilename(files[0].name))]
            : await assetApiClient.uploadVideoBulk(files);
        video = [...video, ...uploaded].sort((a, b) => a.label.localeCompare(b.label));
      }
      toast.success(
        files.length === 1 ? "Asset uploaded" : `${files.length} assets uploaded`,
      );
    } catch {
      toast.error("Upload failed");
    } finally {
      uploading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------

  /** Opens the edit dialog for the given asset. */
  function handleEdit(asset: AnyAsset) {
    editTarget = asset;
    editOpen = true;
  }

  /** Patches the asset with the updated label/artist and updates the local list. */
  async function handleSave(patch: { label: string; artist: string }) {
    if (!editTarget) return;
    saving = true;
    try {
      if (activeTab === "images") {
        const updated = await assetApiClient.patchImage(editTarget.id, patch);
        images = images.map((a) => (a.id === updated.id ? updated : a));
      } else if (activeTab === "audio") {
        const updated = await assetApiClient.patchAudio(editTarget.id, patch);
        audio = audio.map((a) => (a.id === updated.id ? updated : a));
      } else {
        const updated = await assetApiClient.patchVideo(editTarget.id, patch);
        video = video.map((a) => (a.id === updated.id ? updated : a));
      }
      toast.success("Asset updated");
      editOpen = false;
      editTarget = null;
    } catch {
      toast.error("Failed to save changes");
    } finally {
      saving = false;
    }
  }

  /** Closes the edit dialog without saving. */
  function handleEditCancel() {
    editOpen = false;
    editTarget = null;
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /** Opens the delete confirmation dialog for the given asset. */
  function handleDelete(asset: AnyAsset) {
    deleteTarget = asset;
    deleteOpen = true;
  }

  /** Confirms deletion: removes from DB + R2 and updates the local list. */
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      if (activeTab === "images") {
        await assetApiClient.deleteImage(deleteTarget.id);
        images = images.filter((a) => a.id !== deleteTarget!.id);
      } else if (activeTab === "audio") {
        await assetApiClient.deleteAudio(deleteTarget.id);
        audio = audio.filter((a) => a.id !== deleteTarget!.id);
      } else {
        await assetApiClient.deleteVideo(deleteTarget.id);
        video = video.filter((a) => a.id !== deleteTarget!.id);
      }
      toast.success("Asset deleted");
      deleteOpen = false;
      deleteTarget = null;
    } catch {
      toast.error("Failed to delete asset");
    } finally {
      deleting = false;
    }
  }

  /** Cancels the delete dialog. */
  function handleDeleteCancel() {
    deleteOpen = false;
    deleteTarget = null;
  }

  // ---------------------------------------------------------------------------
  // Replace
  // ---------------------------------------------------------------------------

  /** Replaces the file for an asset without changing its metadata. */
  async function handleReplace(asset: AnyAsset, file: File) {
    replacingId = asset.id;
    try {
      if (activeTab === "images") {
        const updated = await assetApiClient.replaceImage(asset.id, file);
        images = images.map((a) => (a.id === updated.id ? updated : a));
      } else if (activeTab === "audio") {
        const updated = await assetApiClient.replaceAudio(asset.id, file, normMode);
        audio = audio.map((a) => (a.id === updated.id ? updated : a));
      } else {
        const updated = await assetApiClient.replaceVideo(asset.id, file);
        video = video.map((a) => (a.id === updated.id ? updated : a));
      }
      toast.success("File replaced");
    } catch {
      toast.error("Failed to replace file");
    } finally {
      replacingId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Maps a tab name to the MIME type accepted by that tab's upload zone. */
  const ACCEPT: Record<AssetTab, string> = {
    images: "image/*",
    audio: "audio/*",
    video: "video/*",
  };

  /** Returns the raw asset list for the currently active tab. */
  function currentAssets(): AnyAsset[] {
    if (activeTab === "images") return images;
    if (activeTab === "audio") return audio;
    return video;
  }

  /**
   * Returns assets for the active tab filtered by the current search query.
   * Matches against label and artist (case-insensitive). Returns all assets when
   * the query is empty.
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

  /**
   * Compares two date strings for descending sort (newest first).
   * Falls back to 0 if either value is missing.
   */
  function dateDiff(a: string | undefined, b: string | undefined): number {
    return (new Date(b ?? 0).getTime()) - (new Date(a ?? 0).getTime());
  }

  /** Returns filtered assets sorted by the active sort key. */
  function sortedAssets(): AnyAsset[] {
    const assets = filteredAssets();
    return [...assets].sort((a, b) => {
      switch (sortBy) {
        case "label-asc":   return a.label.localeCompare(b.label);
        case "label-desc":  return b.label.localeCompare(a.label);
        case "artist-asc":  return (a.artist ?? "").localeCompare(b.artist ?? "");
        case "artist-desc": return (b.artist ?? "").localeCompare(a.artist ?? "");
        case "created-desc": return dateDiff(a.created_at, b.created_at);
        case "created-asc":  return dateDiff(b.created_at, a.created_at);
        case "updated-desc": return dateDiff(a.updated_at, b.updated_at);
      }
    });
  }
</script>

<div class="library">
  <Tabs.Root value={activeTab} onValueChange={handleTabChange} class="subtabs-root">
    <Tabs.List class="subtab-list">
      <Tabs.Trigger value="images" class="subtab">Images</Tabs.Trigger>
      <Tabs.Trigger value="audio" class="subtab">Audio</Tabs.Trigger>
      <Tabs.Trigger value="video" class="subtab">Video</Tabs.Trigger>
    </Tabs.List>

  </Tabs.Root>

  <!-- Content rendered with {#if} so only the active tab is mounted -->
  <div class="tab-content">
    {#if activeTab === "audio"}
      <div class="norm-row">
        <span class="norm-label">Normalisation</span>
        <ToggleGroup.Root
          type="single"
          value={normMode}
          onValueChange={(v) => { if (v) normMode = v as "music" | "ambience"; }}
          class="norm-group"
        >
          <ToggleGroup.Item value="music" class="norm-item">Music</ToggleGroup.Item>
          <ToggleGroup.Item value="ambience" class="norm-item">Ambience</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    {/if}

    <AssetUploadZone
      accept={ACCEPT[activeTab]}
      {uploading}
      onfiles={handleUpload}
    />

    <div class="toolbar">
      <div class="search-row">
        <span class="search-icon"><Search size={14} /></span>
        <input
          class="search-input"
          type="search"
          placeholder="Search by label or artist…"
          bind:value={searchQuery}
        />
      </div>

      <Select.Root
        type="single"
        value={sortBy}
        onValueChange={(v) => { if (v) sortBy = v as SortKey; }}
      >
        <Select.Trigger class="sort-trigger">
          {SORT_LABELS[sortBy]}
          <ChevronDown size={13} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class="sort-content" sideOffset={4}>
            {#each ([
              { value: "label-asc",    label: "Label A→Z" },
              { value: "label-desc",   label: "Label Z→A" },
              { value: "artist-asc",   label: "Artist A→Z" },
              { value: "artist-desc",  label: "Artist Z→A" },
              { value: "created-desc", label: "Newest first" },
              { value: "created-asc",  label: "Oldest first" },
              { value: "updated-desc", label: "Recently updated" },
            ] as { value: SortKey; label: string }[]) as opt}
              <Select.Item value={opt.value} class="sort-option">{opt.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>

    {#if loadingTab}
      <p class="status">Loading…</p>
    {:else if currentAssets().length === 0}
      <p class="status">No {activeTab} uploaded yet.</p>
    {:else if sortedAssets().length === 0}
      <p class="status">No results for "{searchQuery}".</p>
    {:else}
      <div class="grid">
        {#each sortedAssets() as asset (asset.id)}
          <AssetCard
            {asset}
            replacing={replacingId === asset.id}
            onedit={handleEdit}
            ondelete={handleDelete}
            onreplace={handleReplace}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Edit dialog — rendered outside the grid so it doesn't inherit grid layout -->
{#if editTarget}
  <AssetEditDialog
    asset={editTarget}
    bind:open={editOpen}
    {saving}
    onsave={handleSave}
    oncancel={handleEditCancel}
  />
{/if}

<!-- Delete confirmation dialog -->
{#if deleteTarget}
  <AssetDeleteDialog
    asset={deleteTarget}
    bind:open={deleteOpen}
    {deleting}
    onconfirm={handleConfirmDelete}
    oncancel={handleDeleteCancel}
  />
{/if}

<style>
  .library {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  :global(.subtabs-root) {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.subtab-list) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0;
  }

  :global(.subtab) {
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

  :global(.subtab:hover) {
    color: var(--color-text);
  }

  :global(.subtab[data-state="active"]) {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  :global(.tab-content) {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .norm-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .norm-label {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    white-space: nowrap;
  }

  :global(.norm-group) {
    display: flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    overflow: hidden;
  }

  :global(.norm-item) {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    padding: var(--space-1) var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    transition:
      background var(--ease-fast),
      color var(--ease-fast);
  }

  :global(.norm-item:hover) {
    background: rgba(255, 255, 255, 0.06);
    color: var(--color-text);
  }

  :global(.norm-item[data-state="on"]) {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }

  .toolbar {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .search-row {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
  }

  .search-icon {
    position: absolute;
    left: var(--space-3);
    color: var(--color-text-faint);
    display: flex;
    pointer-events: none;
  }

  .search-input {
    box-sizing: border-box;
    width: 100%;
    padding: var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 14px + var(--space-2));
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .search-input:focus {
    border-color: var(--color-text-faint);
  }

  .search-input::placeholder {
    color: var(--color-text-faint);
  }

  :global(.sort-trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: none;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    min-width: 160px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-muted);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color var(--ease-fast);
  }

  :global(.sort-trigger:hover),
  :global(.sort-trigger[data-state="open"]) {
    border-color: var(--color-text-faint);
    color: var(--color-text);
  }

  :global(.sort-content) {
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    padding: var(--space-1) 0;
    min-width: 160px;
    z-index: 60;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  :global(.sort-option) {
    display: block;
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    user-select: none;
    transition: background var(--ease-fast), color var(--ease-fast);
  }

  :global(.sort-option[data-highlighted]) {
    background: rgba(255, 255, 255, 0.07);
    color: var(--color-text);
  }

  :global(.sort-option[data-selected]) {
    color: var(--color-text);
    font-weight: 500;
  }

  .status {
    color: var(--color-text-faint);
    font-size: var(--text-sm);
    font-style: italic;
    padding: var(--space-4) 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-3);
  }
</style>
