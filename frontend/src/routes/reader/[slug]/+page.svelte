<script lang="ts">
  import { marked } from "marked";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount, onDestroy } from "svelte";
  import { readerState } from "$lib/stores/readerState.svelte";
  import { readerEngine } from "$lib/engines/readerEngine";
  import { readerApiClient } from "$lib/services/readerApiClient";
  import { parseReader } from "$lib/utils/readerParser";
  import SceneRenderer from "$lib/components/scene/SceneRenderer.svelte";
  import StoryGate from "$lib/components/scene/StoryGate.svelte";
  import type { ParsedReader } from "$lib/types/reader";

  let parsed = $state<ParsedReader | null>(null);
  let loading = $state(false);
  let contentEl: HTMLElement | null = $state(null);

  onMount(async () => {
    const slug = page.params.slug;
    if (!slug) return;
    loading = true;
    const raw = await readerApiClient.fetch(slug);
    const p = parseReader(raw);
    parsed = p;
    readerEngine.setStory(p);
    loading = false;
  });

  $effect(() => {
    if (!contentEl || !readerState.renderReady) return;

    function onScroll() {
      if (contentEl) readerEngine.checkTriggers(contentEl);
    }

    contentEl.addEventListener("scroll", onScroll, { passive: true });
    return () => contentEl?.removeEventListener("scroll", onScroll);
  });

  onDestroy(() => readerEngine.reset());
</script>

<div class="reader-bg">
  <SceneRenderer slotState={readerState} />
</div>
<div class="reader-overlay" style:opacity={readerState.overlayOpacity}></div>

{#if loading}
  <div class="reader-status"><span>Loading…</span></div>
{:else if !readerState.renderReady && parsed}
  <StoryGate
    onunlock={() => readerEngine.unlock()}
    title={parsed?.frontmatter.title ?? ""}
  />
{:else if readerState.renderReady && parsed}
  <div class="content-panel" bind:this={contentEl}>
    <div class="content-inner">
      <button class="nav-link" onclick={() => goto("/reader")}>← Stories</button
      >

      {#each parsed.segments as segment}
        {#if segment.trigger}
          <div
            class="sentinel"
            data-trigger={JSON.stringify(segment.trigger)}
          ></div>
        {/if}
        {@html marked.parse(segment.text)}
      {/each}

      <div class="end-spacer"></div>
    </div>
  </div>
{/if}

<style>
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
    transition: opacity 1s ease;
  }

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

  .content-inner :global(h1),
  .content-inner :global(h2),
  .content-inner :global(h3) {
    font-family: var(--font-display);
    color: var(--color-text);
    letter-spacing: var(--tracking-wide);
    margin: 2.5em 0 0.75em;
  }

  .content-inner :global(h1) {
    font-size: var(--text-xl);
  }
  .content-inner :global(h2) {
    font-size: var(--text-lg);
  }
  .content-inner :global(h3) {
    font-size: var(--text-base);
  }

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

  .content-inner :global(strong) {
    font-weight: 600;
  }
  .content-inner :global(em) {
    font-style: italic;
  }

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

  .nav-link {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
    transition: color var(--ease-fast);
    margin-bottom: var(--space-10);
  }

  .nav-link:hover {
    color: var(--color-text);
  }
</style>
