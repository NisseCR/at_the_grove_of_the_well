<script lang="ts">
  import type { ChapterSegment } from "$lib/types/story";
  import ProseBlock from "./ProseBlock.svelte";

  let { segments }: { segments: ChapterSegment[] } = $props();

  const dropCap = $derived(
    segments[0]?.blocks[0]?.type === "prose" &&
      !/^["""'''«‹]/.test(
        segments[0].blocks[0].paragraphs[0]?.[0]?.text?.[0] ?? "",
      ),
  );
</script>

<div class="content">
  <article class="chapter-prose">
    {#each segments as segment, si}
      {#if segment.trigger}
        <div class="trigger-sentinel" data-trigger={si}></div>
      {/if}
      {#each segment.blocks as block, bi}
        <ProseBlock {block} dropCap={si === 0 && bi === 0 && dropCap} />
      {/each}
    {/each}
  </article>
</div>

<style>
  .content {
    position: relative;
    z-index: 2;
    max-width: 67ch;
    margin: 0 auto;
    padding: 4rem 1.5rem 12rem;
  }

  .chapter-prose {
    font-family: "EB Garamond", Georgia, serif;
    font-size: clamp(20px, 1.5vw, 23px);
    line-height: 1.9;
    letter-spacing: 0.01em;
    font-feature-settings:
      "liga" 1,
      "kern" 1,
      "clig" 1;
  }

  .chapter-prose :global(p) {
    margin: 0;
    text-align: justify;
    text-justify: inter-word;
    hyphens: none;
    overflow-wrap: normal;
    word-break: normal;
    text-shadow:
      0 1px 12px rgba(0, 0, 0, 0.9),
      0 0 40px rgba(0, 0, 0, 0.6);
  }

  .chapter-prose :global(p + p),
  .chapter-prose :global(.trigger-sentinel + p) {
    text-indent: 1.6em;
  }

  /* no indent when the sentinel follows a divider — sentinel is invisible but still breaks p+p */
  .chapter-prose :global(hr + .trigger-sentinel + p) {
    text-indent: 0;
  }

  .chapter-prose :global(.poem) {
    margin: 2em 0;
  }

  .chapter-prose :global(.poem p) {
    text-indent: 0;
    text-align: left;
  }

  .chapter-prose :global(.poem p + p) {
    text-indent: 0;
    margin-top: 1.9em;
  }

  .chapter-prose :global(hr) {
    border: none;
    text-align: center;
    margin: 2.5em 0;
    opacity: 0.4;
  }

  .chapter-prose :global(hr)::before {
    content: "* * *";
    letter-spacing: 0.5em;
  }

  .trigger-sentinel {
    height: 0;
    overflow: hidden;
  }
</style>
