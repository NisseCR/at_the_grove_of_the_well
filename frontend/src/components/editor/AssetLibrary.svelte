<script lang="ts">
  import { assetApiClient } from "@/lib/services/assetApiClient";
  import type { AnyAsset, AssetType, AudioAsset, ImageAsset, VideoAsset } from "@/types/assets";
  import AssetCard from "./AssetCard.svelte";
  import AssetUpload from "./AssetUpload.svelte";

  type Tab = AssetType;

  let activeTab = $state<Tab>("image");
  let images = $state<ImageAsset[]>([]);
  let audio = $state<AudioAsset[]>([]);
  let video = $state<VideoAsset[]>([]);
  let loading = $state(false);
  let uploading = $state(false);
  let error = $state<string | null>(null);

  const assets = $derived<AnyAsset[]>(
    activeTab === "image" ? images : activeTab === "audio" ? audio : video
  );

  const accept = $derived(
    activeTab === "image" ? "image/*" : activeTab === "audio" ? "audio/*" : "video/webm"
  );

  $effect(() => {
    loadAssets(activeTab);
  });

  async function loadAssets(type: Tab) {
    loading = true;
    error = null;
    try {
      if (type === "image") images = await assetApiClient.listImages();
      else if (type === "audio") audio = await assetApiClient.listAudio();
      else video = await assetApiClient.listVideo();
    } catch {
      error = "Failed to load assets.";
    } finally {
      loading = false;
    }
  }

  async function handleUpload(file: File, label: string) {
    uploading = true;
    error = null;
    try {
      if (activeTab === "image") {
        images = [...images, await assetApiClient.uploadImage(file, label)];
      } else if (activeTab === "audio") {
        audio = [...audio, await assetApiClient.uploadAudio(file, label)];
      } else {
        video = [...video, await assetApiClient.uploadVideo(file, label)];
      }
    } catch {
      error = "Upload failed.";
    } finally {
      uploading = false;
    }
  }

  async function handleBulkUpload(files: File[]) {
    uploading = true;
    error = null;
    try {
      if (activeTab === "image") {
        images = [...images, ...await assetApiClient.uploadImagesBulk(files)];
      } else if (activeTab === "audio") {
        audio = [...audio, ...await assetApiClient.uploadAudioBulk(files)];
      } else {
        video = [...video, ...await assetApiClient.uploadVideoBulk(files)];
      }
    } catch {
      error = "Bulk upload failed.";
    } finally {
      uploading = false;
    }
  }

  async function handlePatchLabel(id: string, label: string) {
    try {
      if (activeTab === "image") {
        const updated = await assetApiClient.patchImageLabel(id, label);
        images = images.map((a) => (a.id === id ? updated : a));
      } else if (activeTab === "audio") {
        const updated = await assetApiClient.patchAudioLabel(id, label);
        audio = audio.map((a) => (a.id === id ? updated : a));
      } else {
        const updated = await assetApiClient.patchVideoLabel(id, label);
        video = video.map((a) => (a.id === id ? updated : a));
      }
    } catch {
      error = "Failed to update label.";
    }
  }

  async function handleReplace(id: string, file: File) {
    try {
      if (activeTab === "image") {
        const updated = await assetApiClient.replaceImage(id, file);
        images = images.map((a) => (a.id === id ? updated : a));
      } else if (activeTab === "audio") {
        const updated = await assetApiClient.replaceAudio(id, file);
        audio = audio.map((a) => (a.id === id ? updated : a));
      } else {
        const updated = await assetApiClient.replaceVideo(id, file);
        video = video.map((a) => (a.id === id ? updated : a));
      }
    } catch {
      error = "Failed to replace file.";
    }
  }

  async function handleDelete(id: string) {
    try {
      if (activeTab === "image") {
        await assetApiClient.deleteImage(id);
        images = images.filter((a) => a.id !== id);
      } else if (activeTab === "audio") {
        await assetApiClient.deleteAudio(id);
        audio = audio.filter((a) => a.id !== id);
      } else {
        await assetApiClient.deleteVideo(id);
        video = video.filter((a) => a.id !== id);
      }
    } catch {
      error = "Failed to delete asset.";
    }
  }
</script>

<div class="library">
  <nav class="sub-tabs">
    <button class="sub-tab" class:active={activeTab === "image"} onclick={() => (activeTab = "image")}>
      Images
    </button>
    <button class="sub-tab" class:active={activeTab === "audio"} onclick={() => (activeTab = "audio")}>
      Audio
    </button>
    <button class="sub-tab" class:active={activeTab === "video"} onclick={() => (activeTab = "video")}>
      Video
    </button>
  </nav>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <AssetUpload
    {accept}
    {uploading}
    onUpload={handleUpload}
    onBulkUpload={handleBulkUpload}
  />

  {#if loading}
    <p class="status">Loading…</p>
  {:else if assets.length === 0}
    <p class="status">No assets yet.</p>
  {:else}
    <div class="grid">
      {#each assets as asset (asset.id)}
        <AssetCard
          {asset}
          type={activeTab}
          onPatchLabel={handlePatchLabel}
          onReplace={handleReplace}
          onDelete={handleDelete}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .library {
    display: flex;
    flex-direction: column;
  }

  .sub-tabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-6);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0;
  }

  .sub-tab {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    padding: var(--space-2) var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .sub-tab:hover {
    color: var(--color-text);
  }

  .sub-tab.active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-3);
  }

  .status {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
  }

  .error {
    font-size: var(--text-xs);
    color: var(--color-error, #e05);
    margin-bottom: var(--space-4);
  }
</style>
