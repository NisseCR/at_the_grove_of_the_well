<script lang="ts">
  import { Tabs } from "bits-ui";
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

  /** Switches the active tab and triggers a fetch if needed. */
  function handleTabChange(tab: string) {
    activeTab = tab as AssetTab;
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
            ? [await assetApiClient.uploadAudio(files[0], labelFromFilename(files[0].name))]
            : await assetApiClient.uploadAudioBulk(files);
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
    try {
      if (activeTab === "images") {
        const updated = await assetApiClient.replaceImage(asset.id, file);
        images = images.map((a) => (a.id === updated.id ? updated : a));
      } else if (activeTab === "audio") {
        const updated = await assetApiClient.replaceAudio(asset.id, file);
        audio = audio.map((a) => (a.id === updated.id ? updated : a));
      } else {
        const updated = await assetApiClient.replaceVideo(asset.id, file);
        video = video.map((a) => (a.id === updated.id ? updated : a));
      }
      toast.success("File replaced");
    } catch {
      toast.error("Failed to replace file");
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

  /** Returns the asset list for the currently active tab. */
  function currentAssets(): AnyAsset[] {
    if (activeTab === "images") return images;
    if (activeTab === "audio") return audio;
    return video;
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
    <AssetUploadZone
      accept={ACCEPT[activeTab]}
      {uploading}
      onfiles={handleUpload}
    />

    {#if loadingTab}
      <p class="status">Loading…</p>
    {:else if currentAssets().length === 0}
      <p class="status">No {activeTab} uploaded yet.</p>
    {:else}
      <div class="grid">
        {#each currentAssets() as asset (asset.id)}
          <AssetCard
            {asset}
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
