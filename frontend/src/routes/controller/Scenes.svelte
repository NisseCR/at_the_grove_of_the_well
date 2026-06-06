<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "$lib/stores/appState.svelte";
  import { sendSetScene } from "$lib/services/transport";
  import { sceneApiClient } from "$lib/services/sceneApiClient";
  import type { Scene, SceneCategory } from "$lib/types/scene";
  import CategoryHeader from "./CategoryHeader.svelte";
  import ThumbnailTile from "./ThumbnailTile.svelte";

  let categories = $state<SceneCategory[]>([]);
  let scenes = $state<Scene[]>([]);

  onMount(async () => {
    [categories, scenes] = await Promise.all([
      sceneApiClient.fetchSceneCategories(),
      sceneApiClient.fetchScenes(),
    ]);
  });

  function thumbnailFor(id: string): string | undefined {
    const bg = scenes.find((s) => s.id === id)?.background;
    return bg?.thumb_url ?? bg?.url ?? undefined;
  }

  function isActive(id: string): boolean {
    return appState.scene?.id === id;
  }
</script>

<div class="categories">
  {#each categories as category}
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
