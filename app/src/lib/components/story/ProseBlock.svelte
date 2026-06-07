<script lang="ts">
  import type { ChapterBlock } from '$lib/types/story';
  import { scrollReveal } from '$lib/actions/scrollReveal';

  let { block, dropCap = false }: { block: ChapterBlock; dropCap?: boolean } = $props();
</script>

{#if block.type === 'prose'}
  {#each block.paragraphs as spans, i}
    <p use:scrollReveal class:drop-cap={dropCap && i === 0}>
      {#each spans as span}
        {#if span.bold && span.italic}<strong><em>{span.text}</em></strong
        >{:else if span.bold}<strong>{span.text}</strong
        >{:else if span.italic}<em>{span.text}</em
        >{:else}{span.text}{/if}
      {/each}
    </p>
  {/each}
{:else if block.type === 'divider'}
  <hr use:scrollReveal />
{/if}

<style>
  .drop-cap::first-letter {
    font-family: 'Cinzel', serif;
    font-size: 4.2em;
    font-weight: 600;
    float: left;
    line-height: 0.75;
    margin: 0.05em 0.1em 0 0;
  }
</style>
