<script lang="ts">
  import { appState } from "@/stores/appState.svelte";
  import { sendSetScene } from "@/lib/services/transport";

  const SCENE_IDS = ["abyssus", "study", "crows"];
</script>

<section>
  <h2>Scene</h2>
  <div class="buttons">
    {#each SCENE_IDS as scene_id}
      <button
        class={appState.scene?.id === scene_id ? "active" : ""}
        onclick={() => sendSetScene(scene_id)}
      >
        {scene_id}
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
