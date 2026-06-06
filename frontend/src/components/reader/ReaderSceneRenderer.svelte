<script lang="ts">
  import { readerState } from "@/stores/readerState.svelte";
  import { sceneEngine } from "@/lib/engines/sceneEngine";
  import SceneAsset from "@/components/player/SceneAsset.svelte";
  import type { Scene } from "@/types/scene";

  let currentContainer: HTMLElement | null = $state(null);

  $effect(() => {
    const sceneId = readerState.requestedSceneId;
    if (sceneId) {
      sceneEngine.transitionScene(sceneId, () => currentContainer, readerState);
    }
  });

  /**
   * Return the scene's layers sorted ascending by order so higher-order
   * layers render on top.
   */
  function sortedLayers(config: Scene) {
    return config ? [...config.layers].sort((a, b) => a.order - b.order) : [];
  }
</script>

{#if readerState.current}
  <div class="scene-slot" bind:this={currentContainer}>
    <SceneAsset asset={readerState.current.background} zIndex={0} />
    {#each sortedLayers(readerState.current) as layer (layer.id)}
      <SceneAsset asset={layer} zIndex={layer.order + 1} />
    {/each}
  </div>
{/if}

<style>
  .scene-slot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
