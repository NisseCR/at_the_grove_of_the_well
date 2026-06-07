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
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
    margin: 0 0 0.5rem;
  }

  .chapter-title {
    font-size: 2.5rem;
    font-weight: 600;
    margin: 0;
  }
</style>
