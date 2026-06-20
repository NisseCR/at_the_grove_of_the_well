<script lang="ts">
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetScene } from "$lib/services/transport";
  import type { PageData } from "./$types";
  import type { SceneId } from "$lib/types/state";
  import CategoryHeader from "$lib/components/assets/CategoryHeader.svelte";
  import ThumbnailTile from "$lib/components/assets/ThumbnailTile.svelte";

  let { data }: { data: PageData } = $props();

  /**
   * @param id - Scene ID to look up thumbnail for.
   */
  function thumbnailFor(id: SceneId): string | undefined {
    const bg = data.scenes.find((s) => s.id === id)?.background;
    return bg?.thumb_url ?? bg?.url ?? undefined;
  }

  /**
   * @param id - Scene ID to check against active scene.
   */
  function isActive(id: SceneId): boolean {
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
            onclick={() => sendSetScene({ id: entry.id, label: entry.label })}
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
