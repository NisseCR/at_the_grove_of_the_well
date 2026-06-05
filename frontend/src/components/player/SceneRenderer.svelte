<script lang="ts">
  import { sceneState } from "@/stores/sceneState.svelte";
  import { sceneEngine } from "@/lib/engines/sceneEngine";
  import SceneAsset from "@/components/player/SceneAsset.svelte";
  import type { Scene } from "@/types/scene";

  let currentSceneContainer: HTMLElement | null = $state(null);

  $effect(() => {
    const sceneId = sceneState.requestedSceneId;
    if (sceneId) {
      sceneEngine.transitionScene(sceneId, () => currentSceneContainer);
    }
  });

  /**
   * Return the scene's layers sorted ascending by order so higher-order
   * layers render on top. Returns an empty array if config is falsy.
   *
   * @param config - The scene config whose layers should be sorted.
   */
  function sortedLayers(config: Scene) {
    return config ? [...config.layers].sort((a, b) => a.order - b.order) : [];
  }
</script>

<!-- Current scene -->
{#if sceneState.current}
  <div class="scene-slot" bind:this={currentSceneContainer}>
    <SceneAsset asset={sceneState.current.background} zIndex={0} />
    {#each sortedLayers(sceneState.current) as layer (layer.id)}
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
