<script lang="ts">
  import { Tabs } from "bits-ui";
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetAmbiences } from "$lib/services/transport";
  import { DEFAULT_AMBIENCE_TARGET_GAIN } from "$lib/config/audio";
  import SearchBar from "$lib/components/assets/SearchBar.svelte";
  import type { PageData } from "./$types";
  import type { AmbienceId } from "$lib/types/state";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");
  let selectedTab = $state(data.categories[0]?.id ?? "");

  const normalizedQuery = $derived(searchQuery.trim().toLowerCase());

  function matchesQuery(label: string): boolean {
    return label.toLowerCase().includes(normalizedQuery);
  }

  /** Categories filtered to those with at least one match, with non-matching ambiences removed. Passthrough when no query is active. */
  const visibleCategories = $derived(
    normalizedQuery
      ? data.categories
          .map((c) => ({ ...c, ambiences: c.ambiences.filter((a) => matchesQuery(a.label)) }))
          .filter((c) => c.ambiences.length > 0)
      : data.categories,
  );

  /** Selects the first visible category when the currently selected tab is filtered out. */
  $effect(() => {
    if (!normalizedQuery) return;
    const selectedIsVisible = visibleCategories.some((c) => c.id === selectedTab);
    if (!selectedIsVisible && visibleCategories.length > 0) {
      selectedTab = visibleCategories[0].id;
    }
  });

  function isActive(id: AmbienceId): boolean {
    return appState.ambiences.ids.includes(id);
  }

  function toggle(id: AmbienceId, label: string): void {
    const { ids: activeIds, targetGains, volumeGains, labels } = appState.ambiences;
    const next = isActive(id)
      ? activeIds.filter((i) => i !== id)
      : [...activeIds, id];
    sendSetAmbiences(
      next.map((i) => ({
        id: i,
        label: i === id ? label : (labels[i] ?? null),
        targetGain: targetGains[i] ?? DEFAULT_AMBIENCE_TARGET_GAIN,
        volumeGain: volumeGains[i],
      })),
    );
  }
</script>

<div class="ambiences-page">
  <SearchBar bind:value={searchQuery} placeholder="Search ambiences..." />

  <Tabs.Root bind:value={selectedTab} orientation="vertical" class="ambience-tabs">
    <Tabs.List class="category-list">
      {#each visibleCategories as category}
        <Tabs.Trigger value={category.id} class="category-trigger">
          {category.label}
        </Tabs.Trigger>
      {/each}
    </Tabs.List>

    {#each visibleCategories as category}
      {@const bannerSrc = category.thumb_url ?? category.url ?? null}
      <Tabs.Content value={category.id} class="chip-panel">
        <div
          class="panel-banner"
          class:has-image={!!bannerSrc}
          style={bannerSrc ? `--banner-src: url('${bannerSrc}')` : ""}
        >
          <span class="banner-label">{category.label}</span>
        </div>
        <div class="chip-grid">
          {#each category.ambiences as entry}
            <button
              class="chip"
              class:active={isActive(entry.id)}
              onclick={() => toggle(entry.id, `${category.label} / ${entry.label}`)}
            >
              {entry.label}
            </button>
          {/each}
        </div>
      </Tabs.Content>
    {/each}
  </Tabs.Root>
</div>

<style>
  .ambiences-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: var(--space-3);
  }

  :global(.ambience-tabs) {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  :global(.category-list) {
    display: flex;
    flex-direction: column;
    width: 148px;
    flex-shrink: 0;
    overflow-x: hidden;
    overflow-y: auto;
    border-right: 1px solid var(--color-border);
    padding-block: var(--space-1);
  }

  :global(.category-trigger) {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    text-transform: capitalize;
    color: var(--color-text-faint);
    background: none;
    border: none;
    border-left: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  :global(.category-trigger:hover) {
    color: var(--color-text-muted);
  }

  :global(.category-trigger[data-state="active"]) {
    color: var(--color-accent);
    border-left-color: var(--color-accent);
  }

  :global(.chip-panel) {
    flex: 1;
    overflow-y: auto;
  }

  :global(.chip-panel[hidden]) {
    display: none;
  }

  .panel-banner {
    position: relative;
    height: 88px;
    margin: var(--space-4) var(--space-6) var(--space-4);
    overflow: hidden;
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .panel-banner.has-image::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to top, rgba(8, 6, 14, 0.85) 0%, transparent 60%),
      var(--banner-src);
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
  }

  .banner-label {
    position: absolute;
    bottom: var(--space-1);
    left: var(--space-2);
    right: var(--space-2);
    z-index: 1;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    text-transform: capitalize;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
    padding-inline: var(--space-6);
    padding-bottom: var(--space-4);
  }

  .chip {
    display: flex;
    align-items: center;
    height: 40px;
    padding-inline: var(--space-3);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-align: left;
    color: var(--color-text-muted);
    background: var(--color-glass);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast),
      background var(--ease-fast);
  }

  .chip:hover {
    color: var(--color-text);
    background: var(--color-glass-hover);
    border-color: var(--color-border-hover);
  }

  .chip.active {
    color: var(--color-accent);
    border-color: var(--color-border-active);
  }
</style>
