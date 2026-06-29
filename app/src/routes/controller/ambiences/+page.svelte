<script lang="ts">
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetAmbiences } from "$lib/services/transport";
  import { DEFAULT_AMBIENCE_VOLUME } from "$lib/config/audio";
  import type { PageData } from "./$types";
  import type { AmbienceId } from "$lib/types/state";
  import CategoryHeader from "$lib/components/assets/CategoryHeader.svelte";

  let { data }: { data: PageData } = $props();

  /**
   * @param id - Ambience ID to check against active ambiences.
   */
  function isActive(id: AmbienceId): boolean {
    return appState.ambiences.ids.includes(id);
  }

  /**
   * @param id - Ambience ID to toggle.
   * @param label - Display label for the ambience.
   */
  function toggle(id: AmbienceId, label: string): void {
    const { ids: activeIds, targetGains, labels } = appState.ambiences;

    const next = isActive(id)
      ? activeIds.filter((i) => i !== id)
      : [...activeIds, id];

    sendSetAmbiences(
      next.map((i) => ({
        id: i,
        label: i === id ? label : (labels[i] ?? null),
        targetGain: targetGains[i] ?? DEFAULT_AMBIENCE_VOLUME,
      })),
    );
  }
</script>

<div class="categories">
  {#each data.categories as category}
    <div class="category">
      <CategoryHeader label={category.label} />
      <div class="item-list">
        {#each category.ambiences as entry}
          <button
            class="item-row"
            class:active={isActive(entry.id)}
            onclick={() =>
              toggle(entry.id, `${category.label} / ${entry.label}`)}
          >
            {entry.label}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .categories {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
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
