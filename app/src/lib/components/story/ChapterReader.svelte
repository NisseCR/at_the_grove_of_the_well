<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ChapterFrontmatter, ChapterSegment } from '$lib/types/story';
  import ProseBlock from './ProseBlock.svelte';

  let {
    frontmatter,
    segments,
    storyLabel,
    activeTriggerIndex = $bindable(-1),
  }: {
    frontmatter: ChapterFrontmatter;
    segments: ChapterSegment[];
    storyLabel: string;
    activeTriggerIndex?: number;
  } = $props();

  /** Find the last trigger sentinel above the viewport top — bidirectional. */
  function onScroll() {
    const sentinels = document.querySelectorAll<HTMLElement>('[data-trigger]');
    let newIndex = -1;
    for (const el of sentinels) {
      if (el.getBoundingClientRect().top <= 0) {
        newIndex = parseInt(el.dataset.trigger!);
      }
    }
    if (newIndex !== activeTriggerIndex) activeTriggerIndex = newIndex;
  }

  onMount(() => window.addEventListener('scroll', onScroll, { passive: true }));
  onDestroy(() => window.removeEventListener('scroll', onScroll));
</script>

<div class="reader">
  <header class="chapter-header">
    <p class="story-label">{storyLabel}</p>
    <h1 class="chapter-title">{frontmatter.title}</h1>
  </header>

  <article class="chapter-prose">
    {#each segments as segment, i}
      {#if segment.trigger}
        <div class="trigger-sentinel" data-trigger={i}></div>
      {/if}
      {#each segment.blocks as block}
        <ProseBlock {block} />
      {/each}
    {/each}
  </article>
</div>

<style>
  .reader {
    position: relative;
    z-index: 1;
    max-width: 680px;
    margin: 0 auto;
    padding: 4rem 1.5rem 8rem;
  }

  .chapter-header {
    margin-bottom: 3rem;
  }

  .story-label {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
    margin: 0 0 0.5rem;
  }

  .chapter-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }

  .chapter-prose {
    line-height: 1.8;
    font-size: 1.05rem;
  }

  .chapter-prose :global(p) {
    margin: 0 0 1.25em;
  }

  .chapter-prose :global(hr) {
    border: none;
    text-align: center;
    margin: 2.5em 0;
    opacity: 0.4;
  }

  .chapter-prose :global(hr)::before {
    content: '* * *';
    letter-spacing: 0.5em;
  }

  .trigger-sentinel {
    height: 0;
    overflow: hidden;
  }
</style>
