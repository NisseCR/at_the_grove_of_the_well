<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
  import { sendSyncAmbiences } from "@/lib/services/transport";

  const AMBIENCE_IDS = [
    "metronome",
    "blizzard",
    "thunder",
    "wind-distorted",
    "wind-piercing",
  ];

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
    {#each AMBIENCE_IDS as ambience_id}
      <button
        class={isActive(ambience_id) ? "active" : ""}
        onclick={() => toggle(ambience_id)}
      >
        {ambience_id}
      </button>
    {/each}
  </div>
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
