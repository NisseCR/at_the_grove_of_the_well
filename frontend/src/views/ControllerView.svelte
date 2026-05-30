<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
  import { sendSetScene } from "@/lib/services/transport";

  const SCENES = [
    { id: "abyssus", name: "Abyssus" },
    { id: "study", name: "Study" },
    { id: "crows", name: "Crows" },
  ];
</script>

<main class="container">
  <h1>Controller</h1>

  <hr />

  <section>
    <h2>Scene</h2>
    <div class="scene-buttons">
      {#each SCENES as scene}
        <button
          class={appState.scene?.scene_id === scene.id ? "active" : ""}
          onclick={() => sendSetScene(scene.id)}
        >
          {scene.name}
        </button>
      {/each}
    </div>

    <p>
      Active:
      {#if appState.scene?.scene_id}
        <strong>{appState.scene.scene_id}</strong>
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
