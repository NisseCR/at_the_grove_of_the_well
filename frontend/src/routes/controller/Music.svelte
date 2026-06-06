<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "$lib/stores/appState.svelte";
  import { sendSetPlaylist } from "$lib/services/transport";
  import { musicApiClient } from "$lib/services/musicApiClient";
  import type { Playlist, PlaylistCategory } from "$lib/types/music";
  import CategoryHeader from "./CategoryHeader.svelte";
  import ThumbnailTile from "./ThumbnailTile.svelte";

  let categories = $state<PlaylistCategory[]>([]);
  let playlists = $state<Playlist[]>([]);

  onMount(async () => {
    [categories, playlists] = await Promise.all([
      musicApiClient.fetchPlaylistCategories(),
      musicApiClient.fetchPlaylists(),
    ]);
  });

  function thumbnailFor(id: string): string | undefined {
    const p = playlists.find((p) => p.id === id);
    return p?.thumb_url ?? p?.url ?? undefined;
  }

  function isActive(id: string): boolean {
    return appState.music?.id === id;
  }

  function onTileClick(id: string): void {
    if (isActive(id)) {
      sendSetPlaylist(null, null);
    } else {
      const label = playlists.find((p) => p.id === id)?.label ?? null;
      sendSetPlaylist(id, label);
    }
  }
</script>

<div class="categories">
  {#each categories as category}
    <div class="category">
      <CategoryHeader label={category.label} />
      <div class="grid">
        {#each category.playlists as entry}
          <ThumbnailTile
            label={entry.label}
            src={thumbnailFor(entry.id)}
            active={isActive(entry.id)}
            onclick={() => onTileClick(entry.id)}
          />
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .categories {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-3);
  }
</style>
