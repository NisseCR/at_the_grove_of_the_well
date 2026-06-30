<script lang="ts">
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetPlaylist } from "$lib/services/transport";
  import SearchBar from "$lib/components/assets/SearchBar.svelte";
  import CategoryHeader from "$lib/components/assets/CategoryHeader.svelte";
  import ThumbnailTile from "$lib/components/assets/ThumbnailTile.svelte";
  import type { PageData } from "./$types";
  import type { PlaylistId } from "$lib/types/state";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");

  const normalizedQuery = $derived(searchQuery.trim().toLowerCase());

  function matchesQuery(label: string): boolean {
    return label.toLowerCase().includes(normalizedQuery);
  }

  /** Categories filtered to those with at least one match, with non-matching playlists removed. A category name match reveals all its playlists. Passthrough when no query is active. */
  const visibleCategories = $derived(
    normalizedQuery
      ? data.categories
          .map((c) =>
            matchesQuery(c.label)
              ? c
              : { ...c, playlists: c.playlists.filter((p) => matchesQuery(p.label)) },
          )
          .filter((c) => c.playlists.length > 0)
      : data.categories,
  );

  function thumbnailFor(id: PlaylistId): string | undefined {
    const p = data.playlists.find((p) => p.id === id);
    return p?.thumb_url ?? p?.url ?? undefined;
  }

  function isActive(id: PlaylistId): boolean {
    return appState.playlists.id === id;
  }

  function onTileClick(id: PlaylistId): void {
    const targetGain = appState.playlists.targetGain;
    if (isActive(id)) {
      sendSetPlaylist({ id: null, label: null, targetGain });
    } else {
      const label = data.playlists.find((p) => p.id === id)?.label ?? null;
      sendSetPlaylist({ id, label, targetGain });
    }
  }
</script>

<div class="music-page">
  <SearchBar bind:value={searchQuery} placeholder="Search playlists..." />

  <div class="categories">
    {#each visibleCategories as category}
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
</div>

<style>
  .music-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .categories {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
