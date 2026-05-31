<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetScene } from "@/lib/services/transport";
  import { sceneApiClient } from "@/lib/services/sceneApiClient";
  import type { SceneConfig, SceneCategory } from "@/types/scene";

  let categories = $state<SceneCategory[]>([]);
  let scenes = $state<SceneConfig[]>([]);

  onMount(async () => {
    [categories, scenes] = await Promise.all([
      sceneApiClient.fetchSceneCategories(),
      sceneApiClient.fetchScenes(),
    ]);
  });

  function thumbnailFor(id: string): string | undefined {
    return scenes.find((s) => s.id === id)?.background.src;
  }

  function isActive(id: string): boolean {
    return appState.scene?.id === id;
  }
</script>

<div class="categories">
  {#each categories as category}
    <div class="category">
      <h3 class="category-title">{category.id}</h3>
      <div class="grid">
        {#each category.scenes as entry}
          {@const thumbnail = thumbnailFor(entry.id)}
          <button
            class="tile"
            class:active={isActive(entry.id)}
            onclick={() => sendSetScene(entry.id)}
          >
            {#if thumbnail}
              <div class="thumbnail" style="background-image: url('{thumbnail}')"></div>
            {:else}
              <div class="thumbnail placeholder"></div>
            {/if}
            <span class="tile-label">{entry.label}</span>
          </button>
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

  /* ─── Category section ──────────────────────────────────────────────────── */
  .category-title {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  /* ─── Scene grid ────────────────────────────────────────────────────────── */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-3);
  }

  /* ─── Scene tile ────────────────────────────────────────────────────────── */
  .tile {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    background: var(--color-glass);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: border-color var(--ease-fast);
  }

  .tile:hover {
    border-color: var(--color-border-hover);
  }

  .tile.active {
    border-color: var(--color-border-active);
  }

  /* Thumbnail fills the top of the tile at a 16:9-ish ratio */
  .thumbnail {
    width: 100%;
    aspect-ratio: 16 / 10;
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
  }

  .thumbnail.placeholder {
    background: var(--color-glass);
  }

  .tile-label {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    padding: 0 var(--space-2) var(--space-2);
    transition: color var(--ease-fast);
  }

  .tile:hover .tile-label {
    color: var(--color-text);
  }

  .tile.active .tile-label {
    color: var(--color-accent);
  }
</style>
