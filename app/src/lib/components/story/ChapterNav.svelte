<script lang="ts">
  import type { StoryChapter } from '$lib/types/story';

  let {
    storySlug,
    prev,
    next,
  }: {
    storySlug: string;
    prev: StoryChapter | null;
    next: StoryChapter | null;
  } = $props();
</script>

<nav class="chapter-nav">
  <div class="nav-inner">
    {#if prev}
      <a class="nav-link" href="/reader/{storySlug}/{prev.slug}" data-sveltekit-reload>
        ← prev
      </a>
    {:else}
      <span class="nav-ghost">← prev</span>
    {/if}

    {#if next}
      <a class="nav-link" href="/reader/{storySlug}/{next.slug}" data-sveltekit-reload>
        next →
      </a>
    {:else}
      <span class="nav-ghost">next →</span>
    {/if}
  </div>
</nav>

<style>
  .chapter-nav {
    position: relative;
    z-index: 2;
    padding: 4rem 2rem 6rem;
  }

  .nav-inner {
    display: flex;
    justify-content: center;
    gap: 3rem;
    align-items: center;
  }

  .nav-link,
  .nav-ghost {
    font-family: 'Cinzel', serif;
    font-size: var(--text-xs);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .nav-link {
    color: var(--color-text-muted);
    transition: color var(--ease-fast);
  }

  .nav-link:hover {
    color: var(--color-accent);
  }

  .nav-ghost {
    color: var(--color-text-faint);
    pointer-events: none;
  }
</style>
