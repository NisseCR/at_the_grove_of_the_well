<script lang="ts">
  import { sceneState } from "@/stores/sceneState.svelte";
  import { sceneEngine } from "@/lib/engines/sceneEngine";
  import SceneAsset from "@/components/scene/SceneAsset.svelte";
  import type { SceneConfig } from "@/types/scene";

  let currentSceneContainer: HTMLElement | null = null;
  let nextSceneContainer: HTMLElement | null = null;

  $: sceneEngine.currentSceneContainer = currentSceneContainer;
  $: sceneEngine.nextSceneContainer = nextSceneContainer;

  /**
   * TODO
   * @param config
   */
  function sortedLayers(config: SceneConfig) {
    return config ? [...config.layers].sort((a, b) => a.order - b.order) : [];
  }

  // Debug
  // $effect(() => {
  //   console.log("sceneState", $state.snapshot(sceneState));
  // });
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

<!-- Next scene (preloaded, fades in) -->
{#if sceneState.next}
  <div class="scene-slot" style:opacity={0} bind:this={nextSceneContainer}>
    <SceneAsset asset={sceneState.next.background} zIndex={0} />
    {#each sortedLayers(sceneState.next) as layer (layer.id)}
      <SceneAsset asset={layer} zIndex={layer.order + 1} />
    {/each}
  </div>
{/if}

<!-- No active scene -->
{#if !sceneState.current && !sceneState.next}
  <p class="waiting">Waiting for scene…</p>
{/if}

<style>
  .scene-slot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .waiting {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
</style>
