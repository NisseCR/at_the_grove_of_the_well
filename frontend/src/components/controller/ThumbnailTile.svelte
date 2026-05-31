<script lang="ts">
  interface Props {
    label: string;
    src: string | undefined;
    active: boolean;
    onclick: () => void;
    aspectRatio?: string;
    minWidth?: string;
    labelSize?: string;
  }

  const {
    label,
    src,
    active,
    onclick,
    aspectRatio = "16 / 10",
    minWidth = "180px",
    labelSize = "var(--text-sm)",
  }: Props = $props();
</script>

<button
  class="tile"
  class:active
  style="--aspect-ratio: {aspectRatio}; --min-width: {minWidth}; --label-size: {labelSize};"
  {onclick}
>
  {#if src}
    <div class="thumbnail" style="background-image: url('{src}')"></div>
  {:else}
    <div class="thumbnail placeholder"></div>
  {/if}
  <span class="tile-label">{label}</span>
</button>

<style>
  .tile {
    position: relative;
    aspect-ratio: var(--aspect-ratio);
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

  .thumbnail {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
  }

  .thumbnail.placeholder {
    background: var(--color-glass);
  }

  .tile::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(8, 6, 14, 0.85) 0%,
      transparent 60%
    );
    z-index: 1;
  }

  .tile-label {
    position: absolute;
    bottom: var(--space-1);
    left: var(--space-2);
    right: var(--space-2);
    z-index: 2;
    font-size: var(--label-size);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    transition: color var(--ease-fast);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tile:hover .tile-label {
    color: var(--color-text);
  }

  .tile.active .tile-label {
    color: var(--color-accent);
  }
</style>
