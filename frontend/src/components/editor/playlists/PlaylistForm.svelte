<script lang="ts">
  import { Dialog, Label } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { assetUrl } from "@/lib/config";
  import { playlistApiClient } from "@/lib/services/playlistApiClient";
  import type { PlaylistEditor, PlaylistTrackEditor } from "@/types/music";
  import type { AudioAsset, ImageAsset } from "@/types/assets";
  import AssetPickerDialog from "@/components/editor/shared/AssetPickerDialog.svelte";

  interface Props {
    /** Existing playlist to edit, or null when creating. */
    playlist?: PlaylistEditor | null;
    open: boolean;
    saving?: boolean;
    onsave: (data: {
      label: string;
      slug: string;
      volume: number;
      cover_id: string | null;
      tracks: PlaylistTrackEditor[];
    }) => void;
    oncancel: () => void;
  }

  let { playlist = null, open = $bindable(), saving = false, onsave, oncancel }: Props = $props();

  const isNew = $derived(!playlist);
  const title = $derived(isNew ? "New playlist" : `Edit — ${playlist!.label}`);

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------

  let label = $state("");
  let slug = $state("");
  let volume = $state(0.5);
  let coverId = $state<string | null>(null);
  let coverLabel = $state<string | null>(null);
  let coverThumbUrl = $state<string | null>(null);

  let tracks = $state<PlaylistTrackEditor[]>([]);

  let coverPickerOpen = $state(false);
  let trackPickerOpen = $state(false);

  /** Reset all fields to the current playlist values (or defaults). */
  function resetForm() {
    label = playlist?.label ?? "";
    slug = playlist?.slug ?? "";
    volume = playlist?.volume ?? 0.5;
    coverId = playlist?.cover_id ?? null;
    coverLabel = playlist?.thumb_src ? "Cover image" : null;
    coverThumbUrl = playlist?.thumb_url ?? null;
    tracks = playlist?.tracks ? [...playlist.tracks] : [];
  }

  $effect(() => {
    if (open) resetForm();
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /** Submit metadata fields; track changes are already persisted. */
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onsave({ label: label.trim(), slug: slug.trim(), volume, cover_id: coverId, tracks });
  }

  /** Receives the picked cover image and updates local state. */
  function handleCoverPick(asset: ImageAsset) {
    coverId = asset.id;
    coverLabel = asset.label;
    coverThumbUrl = asset.thumb_url ?? assetUrl(asset.src);
    coverPickerOpen = false;
  }

  /** Clears the cover image. */
  function clearCover() {
    coverId = null;
    coverLabel = null;
    coverThumbUrl = null;
  }

  /** Adds a track via API and updates local track list. */
  async function handleTrackPick(asset: AudioAsset) {
    if (!playlist) return;
    if (tracks.some((t) => t.audio_asset_id === asset.id)) {
      toast.error("Track already in playlist");
      trackPickerOpen = false;
      return;
    }
    try {
      await playlistApiClient.addTrack(playlist.id, asset.id);
      tracks = [...tracks, { audio_asset_id: asset.id, label: asset.label, src: asset.src, url: assetUrl(asset.src) }];
      toast.success(`Added "${asset.label}"`);
    } catch {
      toast.error("Failed to add track");
    }
    trackPickerOpen = false;
  }

  /** Removes a track via API and updates local track list. */
  async function handleRemoveTrack(audioAssetId: string) {
    if (!playlist) return;
    try {
      await playlistApiClient.removeTrack(playlist.id, audioAssetId);
      tracks = tracks.filter((t) => t.audio_asset_id !== audioAssetId);
      toast.success("Track removed");
    } catch {
      toast.error("Failed to remove track");
    }
  }

  /** Formats a 0–1 volume value as a percentage string. */
  function fmtVolume(v: number): string {
    return `${Math.round(v * 100)}%`;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="pf-overlay" />
    <Dialog.Content class="pf-panel">
      <Dialog.Title class="pf-title">{title}</Dialog.Title>

      <form onsubmit={handleSubmit} class="form">
        <!-- Label -->
        <div class="field">
          <Label.Root for="pl-label" class="field-label">Label</Label.Root>
          <input
            id="pl-label"
            class="input"
            type="text"
            bind:value={label}
            required
            disabled={saving}
            placeholder="e.g. Tavern ambience"
          />
        </div>

        <!-- Slug -->
        <div class="field">
          <Label.Root for="pl-slug" class="field-label">
            Slug <span class="optional">(optional — used in story tags)</span>
          </Label.Root>
          <input
            id="pl-slug"
            class="input"
            type="text"
            bind:value={slug}
            disabled={saving}
            placeholder="e.g. tavern-ambience"
          />
        </div>

        <!-- Volume -->
        <div class="field">
          <Label.Root for="pl-volume" class="field-label">
            Volume — <span class="value-display">{fmtVolume(volume)}</span>
          </Label.Root>
          <input
            id="pl-volume"
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={volume}
            disabled={saving}
          />
        </div>

        <!-- Cover image -->
        <div class="field">
          <Label.Root class="field-label">Cover image</Label.Root>
          {#if coverThumbUrl}
            <div class="asset-row">
              {#if coverThumbUrl}
                <img src={coverThumbUrl} alt="cover" class="cover-thumb" />
              {/if}
              <span class="asset-label">{coverLabel}</span>
              <button type="button" class="btn-ghost" onclick={() => (coverPickerOpen = true)} disabled={saving}>
                Change
              </button>
              <button type="button" class="btn-ghost btn-ghost--danger" onclick={clearCover} disabled={saving}>
                Clear
              </button>
            </div>
          {:else}
            <button
              type="button"
              class="btn-pick"
              onclick={() => (coverPickerOpen = true)}
              disabled={saving}
            >
              Pick cover image…
            </button>
          {/if}
        </div>

        <!-- Tracks (edit mode only) -->
        {#if !isNew}
          <div class="field">
            <Label.Root class="field-label">Tracks — <span class="value-display">{tracks.length}</span></Label.Root>
            {#if tracks.length > 0}
              <div class="track-list">
                {#each tracks as track (track.audio_asset_id)}
                  <div class="track-row">
                    <span class="track-label">{track.label}</span>
                    <button
                      type="button"
                      class="btn-ghost btn-ghost--danger"
                      onclick={() => handleRemoveTrack(track.audio_asset_id)}
                    >
                      Remove
                    </button>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="empty">No tracks yet.</p>
            {/if}
            <button
              type="button"
              class="btn-pick"
              onclick={() => (trackPickerOpen = true)}
            >
              Add track…
            </button>
          </div>
        {:else}
          <p class="create-note">Tracks can be added after creating the playlist.</p>
        {/if}

        <div class="actions">
          <button type="button" class="btn-secondary" onclick={oncancel} disabled={saving}>Cancel</button>
          <button type="submit" class="btn-primary" disabled={saving || !label.trim()}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

{#if coverPickerOpen}
  <AssetPickerDialog
    bind:open={coverPickerOpen}
    types={["image"]}
    title="Pick cover image"
    onpick={(asset) => handleCoverPick(asset as ImageAsset)}
    oncancel={() => (coverPickerOpen = false)}
  />
{/if}

{#if trackPickerOpen}
  <AssetPickerDialog
    bind:open={trackPickerOpen}
    types={["audio"]}
    title="Add track"
    onpick={(asset) => handleTrackPick(asset as AudioAsset)}
    oncancel={() => (trackPickerOpen = false)}
  />
{/if}

<style>
  :global(.pf-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.pf-panel) {
    position: fixed;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(580px, 92vw);
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.pf-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  :global(.field-label) {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-family: var(--font-body);
  }

  .optional {
    color: var(--color-text-faint);
    font-size: var(--text-xs);
  }

  .value-display {
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }

  .input {
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .input:focus {
    border-color: var(--color-accent);
  }

  .input:disabled {
    opacity: 0.5;
  }

  .slider {
    width: 100%;
    accent-color: var(--color-accent);
    cursor: pointer;
  }

  .slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .asset-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .cover-thumb {
    width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: var(--radius-sm, 4px);
    flex-shrink: 0;
  }

  .asset-label {
    flex: 1;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Track list */
  .track-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .track-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .track-label {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    font-style: italic;
    margin: 0;
  }

  .create-note {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    font-style: italic;
    margin: 0;
  }

  .btn-pick {
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;
    transition: border-color var(--ease-fast), color var(--ease-fast);
  }

  .btn-pick:hover:not(:disabled) {
    border-color: var(--color-text-faint);
    color: var(--color-text-muted);
  }

  .btn-ghost {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
    flex-shrink: 0;
  }

  .btn-ghost:hover:not(:disabled) {
    color: var(--color-text-muted);
  }

  .btn-ghost--danger:hover:not(:disabled) {
    color: #e74c3c;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .btn-primary,
  .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    border: none;
    transition: opacity var(--ease-fast);
  }

  .btn-primary {
    background: var(--color-accent);
    color: #000;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .btn-primary:disabled,
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary:hover:not(:disabled),
  .btn-secondary:hover:not(:disabled) {
    opacity: 0.85;
  }
</style>
