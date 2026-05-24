<script lang="ts">
  import { sceneState } from "@/stores/sceneState.svelte";
  import SceneAsset from "@/components/scene/SceneAsset.svelte";

  const config = $derived(sceneState.config);
  const sortedLayers = $derived(
    config ? [...config.layers].sort((a, b) => a.order - b.order) : [],
  );
</script>

{#if config}
  <SceneAsset asset={config.background} zIndex={0} />

  {#each sortedLayers as layer (layer.id)}
    {#if layer.visible}
      <SceneAsset asset={layer} zIndex={layer.order + 1} />
    {/if}
  {/each}
{:else}
  <p class="waiting">Waiting for scene…</p>
{/if}
