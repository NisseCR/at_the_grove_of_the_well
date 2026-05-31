<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSyncAmbiences } from "@/lib/services/transport";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceCategory } from "@/types/ambience";

  const CARD_WIDTH = 150;
  const GAP = 8;
  const STEP = CARD_WIDTH + GAP;

  let categories = $state<AmbienceCategory[]>([]);
  let selected = $state<AmbienceCategory | null>(null);
  let rail: HTMLDivElement | null = $state(null);

  onMount(async () => {
    categories = await ambienceApiClient.fetchAmbienceCategories();
    if (categories.length > 0) selected = categories[0];
  });

  $effect(() => {
    if (!rail) return;
    const update = () => {
      rail!.style.removeProperty("width");
      rail!.style.removeProperty("flex");
      const available = rail!.offsetWidth;
      const n = Math.max(1, Math.floor(available / STEP));
      rail!.style.width = `${n * CARD_WIDTH + (n - 1) * GAP}px`;
      rail!.style.flex = "none";
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(rail.parentElement!);
    return () => ro.disconnect();
  });

  function scroll(direction: number) {
    rail?.scrollBy({ left: direction * STEP, behavior: "smooth" });
  }

  function scrollToCard(i: number) {
    if (!rail) return;
    const center = i * STEP + CARD_WIDTH / 2 - rail.offsetWidth / 2;
    rail.scrollTo({ left: Math.max(0, center), behavior: "smooth" });
  }

  function onwheel(e: WheelEvent) {
    if (!rail) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    scroll(direction);
  }

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
</script>

<div class="categories">
  <div class="rail-wrapper">
    <button class="nav" onclick={() => scroll(-1)}>‹</button>

    <div class="rail" bind:this={rail} {onwheel}>
      {#each categories as category, i}
        <button
          class="rail-card"
          class:selected={selected?.id === category.id}
          style="--i: {i}"
          onclick={() => { selected = category; scrollToCard(i); }}
        >
          <div class="rail-thumb" style="background-image: url('{category.src}')"></div>
          <span class="rail-label">{category.id}</span>
        </button>
      {/each}
    </div>

    <button class="nav" onclick={() => scroll(1)}>›</button>
  </div>

  {#if selected}
    <ul class="item-list">
      {#each selected.ambiences as entry}
        <li>
          <button
            class="item-row"
            class:active={isActive(entry.id)}
            onclick={() => toggle(entry.id)}
          >
            <span class="item-icon">♪</span>
            {entry.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .categories {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  /* ─── Rail wrapper ──────────────────────────────────────────────────────── */
  .rail-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  .nav {
    flex-shrink: 0;
    font-size: 22px;
    line-height: 1;
    color: var(--color-text-faint);
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
  }

  .nav:hover {
    color: var(--color-text-muted);
  }

  /* ─── Horizontal rail ───────────────────────────────────────────────────── */
  .rail {
    flex: 1;
    display: flex;
    gap: 8px;
    overflow: hidden;
    scroll-snap-type: x mandatory;
  }

  .rail-card {
    position: relative;
    flex-shrink: 0;
    width: 150px;
    height: 90px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid transparent;
    scroll-snap-align: center;
    transition: border-color var(--ease-fast);
    animation: fly-in 300ms ease both;
    animation-delay: calc(var(--i) * 40ms);
  }

  @keyframes fly-in {
    from {
      opacity: 0;
      transform: translateX(16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .rail-thumb {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
  }

  .rail-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(8, 6, 14, 0.65);
    transition: background var(--ease-base);
    z-index: 1;
  }

  .rail-card:hover {
    border-color: var(--color-border);
  }

  .rail-card:hover::before {
    background: rgba(8, 6, 14, 0.5);
  }

  .rail-card.selected {
    border-color: var(--color-border-active);
  }

  .rail-card.selected::before {
    background: rgba(8, 6, 14, 0.45);
  }

  .rail-label {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    text-transform: capitalize;
    text-align: center;
    color: var(--color-text-muted);
    user-select: none;
    transition: color var(--ease-fast);
  }

  .rail-card:hover .rail-label,
  .rail-card.selected .rail-label {
    color: var(--color-accent);
  }

  /* ─── Item list ─────────────────────────────────────────────────────────── */
  .item-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .item-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-base);
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

  .item-icon {
    color: var(--color-text-faint);
    font-size: var(--text-sm);
    flex-shrink: 0;
    transition: color var(--ease-fast);
  }

  .item-row:hover .item-icon {
    color: var(--color-text-muted);
  }

  .item-row.active .item-icon {
    color: var(--color-accent-dim);
  }
</style>
