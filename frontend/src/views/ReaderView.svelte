<script lang="ts">
  import { onDestroy } from "svelte";
  import { marked } from "marked";
  import { navigate, router } from "@/stores/router.svelte";
  import { readerState } from "@/stores/readerState.svelte";
  import { readerEngine } from "@/lib/engines/readerEngine";
  import { readerApiClient } from "@/lib/services/readerApiClient";
  import { parseReader } from "@/lib/utils/readerParser";
  import ReaderSceneRenderer from "@/components/reader/ReaderSceneRenderer.svelte";
  import ReaderGate from "@/components/reader/ReaderGate.svelte";
  import type { ReaderFile, ParsedReader } from "@/types/reader";

  let stories = $state<ReaderFile[]>([]);
  let parsed = $state<ParsedReader | null>(null);
  let loading = $state(false);
  let contentEl: HTMLElement | null = $state(null);

  // Load story list when on the index page
  $effect(() => {
    if (router.slug) return;
    readerApiClient.list().then((s) => (stories = s));
  });

  // Fetch and parse story when a slug is present
  $effect(() => {
    const slug = router.slug;
    if (!slug) { parsed = null; return; }

    loading = true;
    parsed = null;
    readerEngine.reset();

    readerApiClient.fetch(slug).then((raw) => {
      const p = parseReader(raw);
      parsed = p;
      readerEngine.setStory(p);
      loading = false;
    });
  });

  // Register scroll listener once content is rendered and audio is ready
  $effect(() => {
    if (!contentEl || !readerState.audioReady) return;

    function onScroll() {
      if (contentEl) readerEngine.checkTriggers(contentEl);
    }

    contentEl.addEventListener("scroll", onScroll, { passive: true });
    return () => contentEl?.removeEventListener("scroll", onScroll);
  });

  function openStory(slug: string) {
    navigate("reader", slug);
  }

  function goBack() {
    readerEngine.reset();
    navigate("reader");
  }

  onDestroy(() => readerEngine.reset());
</script>

{#if !router.slug}
  <!-- ── Story index ──────────────────────────────────────── -->
  <div class="index">
    <div class="bg"></div>
    <div class="index-content">
      <h1 class="index-title">Stories</h1>
      <nav class="story-list">
        {#each stories as story}
          <button class="story-card" onclick={() => openStory(story.slug)}>
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
{:else}
  <!-- ── Scene background + overlay (always present) ─────── -->
  <div class="reader-bg">
    <ReaderSceneRenderer />
  </div>
  <div class="reader-overlay" style:opacity={readerState.overlayOpacity}></div>

  {#if loading}
    <div class="reader-status"><span>Loading…</span></div>
  {:else if !readerState.audioReady && parsed}
    <ReaderGate onunlock={() => readerEngine.unlock()} />
  {:else if readerState.audioReady && parsed}
    <!-- ── Reading view ──────────────────────────────────── -->
    <div class="content-panel" bind:this={contentEl}>
      <div class="content-inner">
        <button class="nav-link" onclick={goBack}>← Stories</button>

        {#each parsed.segments as segment}
          {#if segment.trigger}
            <div class="sentinel" data-trigger={JSON.stringify(segment.trigger)}></div>
          {/if}
          {@html marked.parse(segment.text)}
        {/each}

        <div class="end-spacer"></div>
      </div>
    </div>
  {/if}
{/if}

<style>
  /* ── Index ──────────────────────────────────────────────── */

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

  /* ── Reader background ──────────────────────────────────── */

  .reader-bg {
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    z-index: 0;
  }

  .reader-overlay {
    position: fixed;
    inset: 0;
    background: black;
    pointer-events: none;
    z-index: 1;
  }

  /* ── Content panel ──────────────────────────────────────── */

  .content-panel {
    position: fixed;
    inset: 0;
    overflow-y: auto;
    z-index: 2;
    display: flex;
    justify-content: center;
  }

  .content-inner {
    width: 100%;
    max-width: 660px;
    padding: var(--space-10) var(--space-8) 0;
    display: flex;
    flex-direction: column;
  }

  .sentinel {
    height: 0;
  }

  .end-spacer {
    height: 40vh;
    flex-shrink: 0;
  }

  /* ── Prose typography ───────────────────────────────────── */

  .content-inner :global(h1),
  .content-inner :global(h2),
  .content-inner :global(h3) {
    font-family: var(--font-display);
    color: var(--color-text);
    letter-spacing: var(--tracking-wide);
    margin: 2.5em 0 0.75em;
  }

  .content-inner :global(h1) { font-size: var(--text-xl); }
  .content-inner :global(h2) { font-size: var(--text-lg); }
  .content-inner :global(h3) { font-size: var(--text-base); }

  .content-inner :global(p) {
    font-family: var(--font-display);
    font-size: var(--text-base);
    line-height: 1.85;
    color: var(--color-text);
    margin: 0 0 1.4em;
    text-indent: 1.5em;
  }

  .content-inner :global(h1 + p),
  .content-inner :global(h2 + p),
  .content-inner :global(h3 + p) {
    text-indent: 0;
  }

  .content-inner :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 2.5em auto;
    width: 40%;
  }

  .content-inner :global(strong) { font-weight: 600; }
  .content-inner :global(em) { font-style: italic; }

  /* ── Status ─────────────────────────────────────────────── */

  .reader-status {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-text-faint);
  }
</style>
