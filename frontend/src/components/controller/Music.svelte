<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetPlaylist } from "@/lib/services/transport";
  import { musicApiClient } from "@/lib/services/musicApiClient";
  import type { Playlist, PlaylistCategory } from "@/types/music";
  import CategoryHeader from "@/components/controller/CategoryHeader.svelte";
  import ThumbnailTile from "@/components/controller/ThumbnailTile.svelte";

  let categories = $state<PlaylistCategory[]>([]);
  let playlists = $state<Playlist[]>([]);

  onMount(async () => {
    [categories, playlists] = await Promise.all([
      musicApiClient.fetchPlaylistCategories(),
      musicApiClient.fetchPlaylists(),
    ]);
  });

  function thumbnailFor(id: string): string | undefined {
    return playlists.find((p) => p.id === id)?.url;
  }

  function isActive(id: string): boolean {
    return appState.music?.playlistId === id;
  }

  function onTileClick(id: string): void {
    sendSetPlaylist(isActive(id) ? null : id);
  }
</script>

<div class="categories">
  {#each categories as category}
    <div class="category">
      <CategoryHeader label={category.id} />
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
