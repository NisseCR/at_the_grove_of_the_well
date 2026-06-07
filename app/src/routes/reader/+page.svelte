<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<main>
  {#each data.stories as story}
    <section>
      <h2>{story.label}</h2>
      <ul>
        {#each story.chapters as chapter}
          <li>
            <a href="/reader/{story.slug}/{chapter.slug}">{chapter.title}</a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</main>
