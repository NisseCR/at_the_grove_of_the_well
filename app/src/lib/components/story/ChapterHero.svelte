<script lang="ts">
  import type { Snippet } from 'svelte';
  import { scrollFade } from '$lib/actions/scrollFade';
  import { heroReveal } from '$lib/actions/heroReveal';

  let { storyLabel, chapterTitle, children }: {
    storyLabel: string;
    chapterTitle: string;
    children?: Snippet;
  } = $props();

  let ctaReady = $state(false);

  function onTypingComplete() {
    setTimeout(() => { ctaReady = true; }, 600);
  }
</script>

<section class="hero">
  <div class="hero-titles" use:heroReveal={{ onComplete: onTypingComplete }} use:scrollFade>
    <p class="story-label">{storyLabel}</p>
    <h1 class="chapter-title">{chapterTitle}</h1>
  </div>
  {#if ctaReady}
    {@render children?.()}
  {/if}
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
    font-size: 13px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    opacity: 0.6;
    margin: 0 0 1.2rem;
  }

  .chapter-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    font-weight: 600;
    line-height: 1.15;
    text-shadow: 0 2px 40px rgba(0, 0, 0, 0.95);
    margin: 0;
  }
</style>
