<script lang="ts">
  import type { ChapterSegment } from '$lib/types/story';
  import ProseBlock from './ProseBlock.svelte';

  let { segments }: { segments: ChapterSegment[] } = $props();
</script>

<div class="content">
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
  .content {
    position: relative;
    z-index: 2;
    max-width: 680px;
    margin: 0 auto;
    padding: 4rem 1.5rem 8rem;
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
