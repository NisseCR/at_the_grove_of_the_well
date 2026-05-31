<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSyncAmbiences, sendResetAudio } from "@/lib/services/transport";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceCategory } from "@/types/ambience";

  let categories = $state<AmbienceCategory[]>([]);
  let expanded = $state(new Set<string>());

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
      : [...current, { id, volume: 1.0 }];
    sendSyncAmbiences(next.map((a) => a.id));
  }

  function toggleCategory(id: string): void {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expanded = next;
  }

  /* Prettify raw ids: "heavy_rain" → "heavy rain" */
  function label(id: string): string {
    return id.replace(/_/g, " ");
  }
</script>

<div class="categories">
  {#each categories as category}
    {@const open = expanded.has(category.id)}

    <div class="category">
      <button
        class="banner"
        class:open
        style="background-image: url('{category.src}')"
        onclick={() => toggleCategory(category.id)}
      >
        <span class="banner-label">{category.id}</span>
        <!-- Chevron rotates 90° → 270° to indicate open/closed -->
        <span class="chevron" class:rotated={open}>›</span>
      </button>

      {#if open}
        <ul class="list">
          {#each category.ambience_ids as id}
            <li>
              <button
                class="row"
                class:active={isActive(id)}
                onclick={() => toggle(id)}
              >
                <span class="row-label">{label(id)}</span>
                <span class="row-dot" class:visible={isActive(id)}></span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}

  <button class="reset" onclick={sendResetAudio}>Reset audio</button>
</div>

<style>
  .categories {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* ─── Category banner ──────────────────────────────────────────────────────
     Full-width image strip. A gradient scrim ensures legibility over any
     image. When open, a bottom inset shadow acts as an accent highlight.    */
  .banner {
    position: relative;
    width: 100%;
    height: 68px;
    background-size: cover;
    background-position: center;
    border-radius: var(--radius-sm);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
  }

  /* Dark gradient scrim so label text is always legible */
  .banner::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(8, 6, 14, 0.80) 0%,
      rgba(8, 6, 14, 0.35) 100%
    );
    transition: background var(--ease-base);
  }

  .banner.open::before {
    background: linear-gradient(
      to right,
      rgba(8, 6, 14, 0.60) 0%,
      rgba(8, 6, 14, 0.20) 100%
    );
  }

  .banner-label {
    position: relative; /* sits above ::before scrim */
    font-family: var(--font-body);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text);
    text-transform: uppercase;
  }

  .chevron {
    position: relative;
    font-size: 20px;
    color: var(--color-text-muted);
    display: inline-block;
    transform: rotate(90deg);
    transition:
      transform var(--ease-base),
      color var(--ease-fast);
  }

  .chevron.rotated {
    transform: rotate(270deg);
    color: var(--color-accent);
  }

  /* ─── List ─────────────────────────────────────────────────────────────────
     Track-listing style: one ambience per row with a divider between items. */
  .list {
    list-style: none;
    padding: var(--space-1) 0;
  }

  .row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    text-transform: capitalize;
    transition: color var(--ease-fast);
  }

  .list li:last-child .row {
    border-bottom: none;
  }

  .row:hover {
    color: var(--color-text);
  }

  .row.active {
    color: var(--color-accent);
  }

  /* Small dot indicator on the right when active */
  .row-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-accent);
    opacity: 0;
    transition: opacity var(--ease-fast);
  }

  .row-dot.visible {
    opacity: 1;
  }

  /* ─── Reset button ──────────────────────────────────────────────────────── */
  .reset {
    align-self: flex-start;
    margin-top: var(--space-4);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .reset:hover {
    color: var(--color-text-muted);
  }
</style>
