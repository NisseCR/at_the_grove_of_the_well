<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
  import { sendSetScene } from "@/lib/services/transport";

  const SCENE_IDS = ["abyssus", "study", "crows"];
  const AMBIENCE_IDS = [
    "blizzard",
    "thunder",
    "wind-distorted",
    "wind-piercing",
  ];
</script>

<main class="container">
  <h1>Controller</h1>

  <hr />

  <section>
    <h2>Scene</h2>
    <div class="scene-buttons">
      {#each SCENE_IDS as scene_id}
        <button
          class={appState.scene?.id === scene_id ? "active" : ""}
          onclick={() => sendSetScene(scene_id)}
        >
          {scene_id}
        </button>
      {/each}
    </div>

    <p>
      Active:
      {#if appState.scene?.id}
        <strong>{appState.scene.id}</strong>
      {:else}
        <span>none</span>
      {/if}
    </p>
  </section>
</main>

<style>
  .scene-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  button.active {
    outline: 2px solid var(--pico-primary);
  }
</style>
