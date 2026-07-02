<script lang="ts">
  import { onDestroy } from "svelte";
  import { toast } from "svelte-sonner";
  import { sceneEngine } from "$lib/engines/sceneEngine";
  import SceneAsset from "./SceneAsset.svelte";
  import type { Scene, SceneSlotState } from "$lib/types/scene";

  let {
    slotState = $bindable(),
    requestedSceneId,
  }: {
    slotState: SceneSlotState;
    requestedSceneId: string | null;
  } = $props();

  let currentContainer: HTMLElement | null = $state(null);
  let nextContainer: HTMLElement | null = $state(null);

  onDestroy(() => {
    slotState.current = null;
    slotState.next = null;
    slotState.isTransitioning = false;
  });

  $effect(() => {
    if (requestedSceneId) {
      sceneEngine
        .transitionScene(requestedSceneId, () => currentContainer, () => nextContainer, slotState)
        .catch(() => toast.error("Scene failed to load"));
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

{#if slotState.next}
  <div class="scene-slot" style="opacity: 0" bind:this={nextContainer}>
    <SceneAsset asset={slotState.next.background} zIndex={0} />
    {#each sortedLayers(slotState.next) as layer (layer.id)}
      <SceneAsset asset={layer} zIndex={layer.order + 1} />
    {/each}
  </div>
{/if}

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
