<script lang="ts">
  import type { Snippet } from 'svelte';
  let { storyLabel, chapterTitle, children }: {
    storyLabel: string;
    chapterTitle: string;
    children?: Snippet;
  } = $props();
</script>

<section class="hero">
  <div class="hero-titles">
    <p class="story-label">{storyLabel}</p>
    <h1 class="chapter-title">{chapterTitle}</h1>
  </div>
  {@render children?.()}
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
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    opacity: 0.6;
    margin: 0 0 1.2rem;
  }

  .chapter-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(2rem, 6vw, 4.5rem);
    font-weight: 600;
    line-height: 1.15;
    text-shadow: 0 2px 40px rgba(0, 0, 0, 0.95);
    margin: 0;
  }
</style>
