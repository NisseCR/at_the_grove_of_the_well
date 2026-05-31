<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSyncAmbiences } from "@/lib/services/transport";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceCategory } from "@/types/ambience";
  import CategoryHeader from "@/components/controller/CategoryHeader.svelte";
  import ThumbnailTile from "@/components/controller/ThumbnailTile.svelte";

  let categories = $state<AmbienceCategory[]>([]);

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
</script>

<div class="categories">
  {#each categories as category}
    <div class="category">
      <CategoryHeader label={category.id} />
      <div class="grid">
        {#each category.ambiences as entry}
          <ThumbnailTile
            label={entry.label}
            src={category.src}
            active={isActive(entry.id)}
            onclick={() => toggle(entry.id)}
            aspectRatio="4 / 3"
            minWidth="90px"
            labelSize="var(--text-xs)"
          />
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

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: var(--space-2);
  }
</style>
