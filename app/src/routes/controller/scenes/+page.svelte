<script lang="ts">
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetScene } from "$lib/services/transport";
  import SearchBar from "$lib/components/assets/SearchBar.svelte";
  import CategoryHeader from "$lib/components/assets/CategoryHeader.svelte";
  import ThumbnailTile from "$lib/components/assets/ThumbnailTile.svelte";
  import type { PageData } from "./$types";
  import type { SceneId } from "$lib/types/state";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");

  const normalizedQuery = $derived(searchQuery.trim().toLowerCase());

  function matchesQuery(label: string): boolean {
    return label.toLowerCase().includes(normalizedQuery);
  }

  /** Categories filtered to those with at least one match, with non-matching scenes removed. Passthrough when no query is active. */
  const visibleCategories = $derived(
    normalizedQuery
      ? data.categories
          .map((c) => ({ ...c, scenes: c.scenes.filter((s) => matchesQuery(s.label)) }))
          .filter((c) => c.scenes.length > 0)
      : data.categories,
  );

  function thumbnailFor(id: SceneId): string | undefined {
    const bg = data.scenes.find((s) => s.id === id)?.background;
    return bg?.thumb_url ?? bg?.url ?? undefined;
  }

  function isActive(id: SceneId): boolean {
    return appState.scene?.id === id;
  }
</script>

<div class="scenes-page">
  <SearchBar bind:value={searchQuery} placeholder="Search scenes..." />

  <div class="categories">
    {#each visibleCategories as category}
      <div class="category">
        <CategoryHeader label={category.label} />
        <div class="grid">
          {#each category.scenes as entry}
            <ThumbnailTile
              label={entry.label}
              src={thumbnailFor(entry.id)}
              active={isActive(entry.id)}
              onclick={() => sendSetScene({ id: entry.id, label: entry.label })}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .scenes-page {
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
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-3);
  }
</style>
