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
    pointer-events: auto;
    font-family: 'Cinzel', serif;
    background: none;
    border: 1px solid currentColor;
    color: inherit;
    padding: 0.5rem 1.5rem;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    margin-right: -0.2em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
    animation: cta-appear 0.6s ease forwards;
  }

  @keyframes cta-appear {
    from { opacity: 0; }
    to   { opacity: 0.7; }
  }

  .begin-cta:hover {
    opacity: 1;
  }
</style>
