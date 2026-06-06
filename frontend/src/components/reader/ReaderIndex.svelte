<script lang="ts">
  import { navigate } from "@/stores/router.svelte";
  import { readerApiClient } from "@/lib/services/readerApiClient";
  import type { ReaderFile } from "@/types/reader";

  let stories = $state<ReaderFile[]>([]);

  $effect(() => {
    readerApiClient.list().then((s) => (stories = s));
  });
</script>

<div class="index">
  <div class="bg"></div>
  <div class="index-content">
    <h1 class="index-title">Stories</h1>
    <nav class="story-list">
      {#each stories as story}
        <button
          class="story-card"
          onclick={() => navigate("reader", story.slug)}
        >
          <span class="story-name">{story.title}</span>
        </button>
      {/each}
      {#if !stories.length}
        <p class="empty">No stories yet.</p>
      {/if}
    </nav>
    <button class="nav-link" onclick={() => navigate("home")}>← Home</button>
  </div>
</div>

<style>
  .index {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .bg {
    position: absolute;
    inset: 0;
    background-image: url("/controller-background.jpg");
    background-size: cover;
    background-position: center;
    filter: blur(var(--blur-bg)) brightness(0.25);
    transform: scale(1.08);
    z-index: 0;
  }

  .index-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-10);
  }

  .index-title {
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .story-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 280px;
  }

  .story-card {
    padding: var(--space-6) var(--space-8);
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    text-align: left;
    transition:
      background var(--ease-fast),
      border-color var(--ease-fast);
  }

  .story-card:hover {
    background: var(--color-glass-hover);
    border-color: var(--color-border-hover);
  }

  .story-name {
    font-family: var(--font-display);
    font-size: var(--text-base);
    color: var(--color-text);
    letter-spacing: var(--tracking-wide);
  }

  .empty {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    letter-spacing: var(--tracking-wide);
  }

  .nav-link {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
    transition: color var(--ease-fast);
  }

  .nav-link:hover {
    color: var(--color-text);
  }
</style>
