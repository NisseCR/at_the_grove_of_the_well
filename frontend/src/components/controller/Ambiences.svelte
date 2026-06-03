<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetAmbiences } from "@/lib/services/transport";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceCategory } from "@/types/ambience";
  import CategoryHeader from "@/components/controller/CategoryHeader.svelte";
  import VerticalNav from "@/components/controller/VerticalNav.svelte";

  let categories = $state<AmbienceCategory[]>([]);
  let categoryEls = $state<HTMLElement[]>([]);

  onMount(async () => {
    categories = await ambienceApiClient.fetchAmbienceCategories();
  });

  function isActive(id: string): boolean {
    return appState.ambiences?.some((a) => a.id === id) ?? false;
  }

  function toggle(id: string): void {
    const current = appState.ambiences ?? [];
    const next = isActive(id)
      ? current.filter((a) => a.id !== id)
      : [...current, { id, volume: 0.5 }];
    sendSetAmbiences(next);
  }
</script>

<div class="ambiences-layout">
  <VerticalNav items={categories.map((c) => c.id)} elements={categoryEls} />

  <div class="categories">
    {#each categories as category, i}
      <div class="category" bind:this={categoryEls[i]}>
        <CategoryHeader label={category.id} src={category.url} />
        <div class="item-list">
          {#each category.ambiences as entry}
            <button
              class="item-row"
              class:active={isActive(entry.id)}
              onclick={() => toggle(entry.id)}
            >
              {entry.label}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .ambiences-layout {
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
  }

  .categories {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    min-width: 0;
  }

  .category {
    display: flex;
    flex-direction: column;
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .item-row {
    display: block;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    background: var(--color-glass);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast),
      background var(--ease-fast);
  }

  .item-row:hover {
    color: var(--color-text);
    background: var(--color-glass-hover);
    border-color: var(--color-border-hover);
  }

  .item-row.active {
    color: var(--color-accent);
    border-color: var(--color-border-active);
  }
</style>
