<script lang="ts">
  import { appState } from "$lib/stores/appState.svelte";
  import { sendSetPlaylist } from "$lib/services/transport";
  import type { PageData } from "./$types";
  import CategoryHeader from "$lib/components/assets/CategoryHeader.svelte";
  import ThumbnailTile from "$lib/components/assets/ThumbnailTile.svelte";

  let { data }: { data: PageData } = $props();

  /**
   * @param id - Playlist ID to look up thumbnail for.
   */
  function thumbnailFor(id: string): string | undefined {
    const p = data.playlists.find((p) => p.id === id);
    return p?.thumb_url ?? p?.url ?? undefined;
  }

  /**
   * @param id - Playlist ID to check against active music.
   */
  function isActive(id: string): boolean {
    return appState.music.activeId === id;
  }

  /**
   * @param id - Playlist ID to activate or deactivate.
   */
  function onTileClick(id: string): void {
    if (isActive(id)) {
      sendSetPlaylist(null, null);
    } else {
      const label = data.playlists.find((p) => p.id === id)?.label ?? null;
      sendSetPlaylist(id, label);
    }
  }
</script>

<div class="categories">
  {#each data.categories as category}
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
