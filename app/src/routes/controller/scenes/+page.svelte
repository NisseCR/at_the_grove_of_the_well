<script lang="ts">
  import { appState } from "$lib/stores/appState.svelte";
  import { sendSetScene } from "$lib/services/transport";
  import type { PageData } from "./$types";
  import CategoryHeader from "../CategoryHeader.svelte";
  import ThumbnailTile from "../ThumbnailTile.svelte";

  let { data }: { data: PageData } = $props();

  /**
   * @param id - Scene ID to look up thumbnail for.
   */
  function thumbnailFor(id: string): string | undefined {
    const bg = data.scenes.find((s) => s.id === id)?.background;
    return bg?.thumb_url ?? bg?.url ?? undefined;
  }

  /**
   * @param id - Scene ID to check against active scene.
   */
  function isActive(id: string): boolean {
    return appState.scene?.id === id;
  }
</script>

<div class="categories">
  {#each data.categories as category}
    <div class="category">
      <CategoryHeader label={category.label} />
      <div class="grid">
        {#each category.scenes as entry}
          <ThumbnailTile
            label={entry.label}
            src={thumbnailFor(entry.id)}
            active={isActive(entry.id)}
            onclick={() => sendSetScene(entry.id, entry.label)}
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
