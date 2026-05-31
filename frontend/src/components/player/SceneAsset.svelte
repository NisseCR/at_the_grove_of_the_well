<script lang="ts">
  import type { BackgroundAsset, LayerAsset } from "@/types/scene";

  interface Props {
    asset: BackgroundAsset | LayerAsset;
    zIndex: number;
  }

  let { asset, zIndex }: Props = $props();

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
  <div
    class="fill"
    style:z-index={zIndex}
    style:mix-blend-mode={asset.blend_mode}
  >
    <img
      class="media"
      src={asset.src}
      alt=""
      aria-hidden="true"
      style:opacity={asset.opacity}
      style:filter={cssFilter()}
      style:transform={asset.flip ? "scaleX(-1)" : "none"}
    />
  </div>
{:else}
  <div
    class="fill"
    style:z-index={zIndex}
    style:mix-blend-mode={asset.blend_mode}
  >
    <video
      class="media"
      src={asset.src}
      autoplay
      loop={asset.loop}
      muted
      playsinline
      style:opacity={asset.opacity}
      style:filter={cssFilter()}
      style:transform={asset.flip ? "scaleX(-1)" : "none"}
    ></video>
  </div>
{/if}

<style>
  .fill {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    will-change: transform;
  }

  .media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
