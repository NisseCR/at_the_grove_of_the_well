<script lang="ts">
  import { onMount } from "svelte";
  import { sceneService } from "@/lib/services/sceneApiClient";
  import type { SceneConfig, LayerConfig } from "@/types/scene";

  // ── State ─────────────────────────────────────────────────────────────────

  let scene = $state<SceneConfig | null>(null);
  let error = $state<string | null>(null);

  const sortedLayers = $derived(
    scene ? [...scene.layers].sort((a, b) => a.order - b.order) : [],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  function cssFilter(layer: LayerConfig): string {
    const f: string[] = [];
    if (layer.brightness !== 1) f.push(`brightness(${layer.brightness})`);
    if (layer.grayscale !== 0) f.push(`grayscale(${layer.grayscale})`);
    if (layer.blur !== 0) f.push(`blur(${layer.blur}px)`);
    return f.length ? f.join(" ") : "none";
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  onMount(async () => {
    try {
      scene = await sceneService.fetchScene("abyssus");
    } catch (e) {
      error = String(e);
    }
  });
</script>

{#if error}
  <div class="state"><p>{error}</p></div>
{:else if !scene}
  <div class="state"><p aria-busy="true">Loading…</p></div>
{:else}
  <div class="scene">
    <!-- Background -->
    <img
      class="fill"
      src={scene.background.src}
      alt=""
      aria-hidden="true"
      style:opacity={scene.background.opacity}
      style:mix-blend-mode={scene.background.blend_mode}
      style:transform={scene.background.flip ? "scaleX(-1)" : "none"}
      style:filter="brightness({scene.background.brightness}) grayscale({scene
        .background.grayscale})"
    />

    <!-- Layers -->
    {#each sortedLayers as layer (layer.id)}
      {#if layer.visible}
        <video
          class="fill"
          src={layer.src}
          autoplay
          loop={layer.loop}
          muted
          playsinline
          style:opacity={layer.opacity}
          style:filter={cssFilter(layer)}
          style:mix-blend-mode={layer.blend_mode}
          style:transform={layer.flip ? "scaleX(-1)" : "none"}
          style:z-index={layer.order}
        ></video>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .scene {
    position: fixed;
    inset: 0;
    background: #000;
    overflow: hidden;
  }

  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .state {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }
</style>
