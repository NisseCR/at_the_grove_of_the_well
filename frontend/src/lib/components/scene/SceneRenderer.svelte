<script lang="ts">
  import { sceneEngine } from "$lib/engines/sceneEngine";
  import SceneAsset from "./SceneAsset.svelte";
  import type { Scene, SceneSlotState } from "$lib/types/scene";

  let { slotState }: { slotState: SceneSlotState } = $props();

  let currentContainer: HTMLElement | null = $state(null);

  $effect(() => {
    const sceneId = slotState.requestedSceneId;
    if (sceneId) {
      sceneEngine.transitionScene(sceneId, () => currentContainer, slotState);
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

{#if slotState.current}
  <div class="scene-slot" bind:this={currentContainer}>
    <SceneAsset asset={slotState.current.background} zIndex={0} />
    {#each sortedLayers(slotState.current) as layer (layer.id)}
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
