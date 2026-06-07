<script lang="ts">
  import type { ChapterBlock } from '$lib/types/story';

  let { block }: { block: ChapterBlock } = $props();
</script>

{#if block.type === 'prose'}
  {#each block.paragraphs as spans}
    <p>
      {#each spans as span}
        {#if span.bold && span.italic}<strong><em>{span.text}</em></strong
        >{:else if span.bold}<strong>{span.text}</strong
        >{:else if span.italic}<em>{span.text}</em
        >{:else}{span.text}{/if}
      {/each}
    </p>
  {/each}
{:else if block.type === 'divider'}
  <hr />
{/if}
