<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const { frontmatter, segments } = data.chapter;
</script>

<article>
  <h1>{frontmatter.title}</h1>

  {#each segments as segment}
    {#each segment.blocks as block}
      {#if block.type === 'prose'}
        {#each block.paragraphs as spans}
          <p>
            {#each spans as span}
              {#if span.bold && span.italic}<strong><em>{span.text}</em></strong>
              {:else if span.bold}<strong>{span.text}</strong>
              {:else if span.italic}<em>{span.text}</em>
              {:else}{span.text}{/if}
            {/each}
          </p>
        {/each}
      {:else if block.type === 'divider'}
        <hr />
      {/if}
    {/each}
  {/each}
</article>
