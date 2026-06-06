<script lang="ts">
  interface Props {
    label: string;
    src?: string;
  }

  const { label, src }: Props = $props();
</script>

<h3
  class="category-header"
  class:has-art={!!src}
  style={src ? `--art-src: url('${src}')` : ""}
>
  {label}
</h3>

<style>
  .category-header {
    position: relative;
    isolation: isolate;
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    text-transform: capitalize;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  .category-header.has-art {
    padding-top: var(--space-8);
    padding-left: var(--space-3);
    border-bottom: none;
  }

  .category-header.has-art::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        to right,
        rgba(0, 0, 0, 0.5) 0%,
        transparent 60%
      ),
      linear-gradient(to bottom, transparent 30%, rgba(0, 0, 0, 0.55) 100%),
      var(--art-src);
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
    z-index: -1;
  }
</style>
