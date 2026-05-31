<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSyncAmbiences, sendResetAudio } from "@/lib/services/transport";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceAsset } from "@/types/ambience";

  let ambiences = $state<AmbienceAsset[]>([]);

  onMount(async () => {
    ambiences = await ambienceApiClient.fetchAmbiences();
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

<section>
  <h2>Ambience</h2>
  <div class="buttons">
    {#each ambiences as ambience}
      <button
        class={isActive(ambience.id) ? "active" : ""}
        onclick={() => toggle(ambience.id)}
      >
        {ambience.id}
      </button>
    {/each}
  </div>
  <button onclick={sendResetAudio}>Reset audio</button>
</section>

<style>
  .buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  button.active {
    outline: 2px solid var(--pico-primary);
  }
</style>
