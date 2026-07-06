<script lang="ts">
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetHandout } from "$lib/services/transport";
  import SearchBar from "$lib/components/assets/SearchBar.svelte";
  import CategoryHeader from "$lib/components/assets/CategoryHeader.svelte";
  import ThumbnailTile from "$lib/components/assets/ThumbnailTile.svelte";
  import type { PageData } from "./$types";
  import type { HandoutId } from "$lib/types/state";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");

  const normalizedQuery = $derived(searchQuery.trim().toLowerCase());

  function matchesQuery(label: string): boolean {
    return label.toLowerCase().includes(normalizedQuery);
  }

  /** Categories filtered to those with at least one match, with non-matching handouts removed. A category name match reveals all its handouts. Passthrough when no query is active. */
  const visibleCategories = $derived(
    normalizedQuery
      ? data.categories
          .map((c) =>
            matchesQuery(c.label)
              ? c
              : { ...c, handouts: c.handouts.filter((h) => matchesQuery(h.label)) },
          )
          .filter((c) => c.handouts.length > 0)
      : data.categories,
  );

  function thumbnailFor(id: HandoutId): string | undefined {
    const h = data.handouts.find((h) => h.id === id);
    return h?.thumb_url ?? h?.url ?? undefined;
  }

  function isActive(id: HandoutId): boolean {
    return appState.handout?.id === id;
  }

  function onTileClick(id: HandoutId, label: string): void {
    if (isActive(id)) {
      sendSetHandout(null);
      return;
    }
    const url = data.handouts.find((h) => h.id === id)?.url;
    if (!url) return;
    sendSetHandout({ id, label, url });
  }
</script>

<div class="handouts-page">
  <SearchBar bind:value={searchQuery} placeholder="Search handouts..." />

  <div class="categories">
    {#each visibleCategories as category}
      <div class="category">
        <CategoryHeader label={category.label} />
        <div class="grid">
          {#each category.handouts as entry}
            <ThumbnailTile
              label={entry.label}
              src={thumbnailFor(entry.id)}
              active={isActive(entry.id)}
              onclick={() => onTileClick(entry.id, entry.label)}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .handouts-page {
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
