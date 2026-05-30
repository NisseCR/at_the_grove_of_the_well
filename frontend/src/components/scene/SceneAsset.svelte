<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { sceneEngine } from "@/lib/services/sceneEngine";
  import type { BackgroundConfig, LayerConfig } from "@/types/scene";

  interface Props {
    asset: BackgroundConfig | LayerConfig;
    zIndex: number;
  }

  let { asset, zIndex }: Props = $props();
  let assetElement: HTMLElement;

  onMount(() => {
    sceneEngine.registerAsset(asset.id, assetElement);
  });

  onDestroy(() => {
    sceneEngine.deleteAsset(asset.id);
  });

  /**
   * Generate a css filter string based on config.
   */
  function cssFilter(): string {
    const f: string[] = [];
    if (asset.brightness !== 1) f.push(`brightness(${asset.brightness})`);
    if (asset.grayscale !== 0) f.push(`grayscale(${asset.grayscale})`);
    if (asset.blur !== 0) f.push(`blur(${asset.blur}px)`);
    return f.length ? f.join(" ") : "none";
  }
</script>

{#if asset.type === "image"}
  <img
    bind:this={assetElement}
    class="fill"
    src={asset.src}
    alt=""
    aria-hidden="true"
    style:opacity={asset.opacity}
    style:filter={cssFilter()}
    style:mix-blend-mode={asset.blend_mode}
    style:transform={asset.flip ? "scaleX(-1)" : "none"}
    style:z-index={zIndex}
  />
{:else}
  <video
    bind:this={assetElement}
    class="fill"
    src={asset.src}
    autoplay
    loop={asset.loop}
    muted
    playsinline
    style:opacity={asset.opacity}
    style:filter={cssFilter()}
    style:mix-blend-mode={asset.blend_mode}
    style:transform={asset.flip ? "scaleX(-1)" : "none"}
    style:z-index={zIndex}
  ></video>
{/if}

<style>
  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
