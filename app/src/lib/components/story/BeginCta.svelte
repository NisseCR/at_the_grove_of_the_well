<script lang="ts">
  let { onunlock }: { onunlock: () => void } = $props();
</script>

<button class="begin-cta" onclick={onunlock}>Click to begin</button>

<style>
  .begin-cta {
    position: absolute;
    bottom: 3rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    background: none;
    border: 1px solid currentColor;
    color: inherit;
    padding: 0.5rem 1.5rem;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    opacity: 0.7;
    white-space: nowrap;
  }

  .begin-cta:hover {
    opacity: 1;
  }
</style>
