<script lang="ts">
  let {
    storyLabel,
    chapterTitle,
    renderReady,
    onunlock,
  }: {
    storyLabel: string;
    chapterTitle: string;
    renderReady: boolean;
    onunlock: () => void;
  } = $props();
</script>

<section class="hero">
  <div class="hero-titles">
    <p class="story-label">{storyLabel}</p>
    <h1 class="chapter-title">{chapterTitle}</h1>
    {#if !renderReady}
      <button class="begin-cta" onclick={onunlock}>Click to begin</button>
    {/if}
  </div>
</section>

<style>
  .hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    pointer-events: none;
  }

  .hero-titles {
    text-align: center;
    pointer-events: auto;
  }

  .story-label {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
    margin: 0 0 0.5rem;
  }

  .chapter-title {
    font-size: 2.5rem;
    font-weight: 600;
    margin: 0 0 2rem;
  }

  .begin-cta {
    background: none;
    border: 1px solid currentColor;
    color: inherit;
    padding: 0.5rem 1.5rem;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    opacity: 0.7;
  }

  .begin-cta:hover {
    opacity: 1;
  }
</style>
