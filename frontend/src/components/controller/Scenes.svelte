<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "@/stores/appState.svelte";
  import { sendSetScene } from "@/lib/services/transport";
  import { sceneApiClient } from "@/lib/services/sceneApiClient";
  import type { SceneConfig } from "@/types/scene";

  let scenes = $state<SceneConfig[]>([]);

  onMount(async () => {
    scenes = await sceneApiClient.fetchScenes();
  });
</script>

<section>
  <h2>Scene</h2>
  <div class="buttons">
    {#each scenes as scene}
      <button
        class={appState.scene?.id === scene.id ? "active" : ""}
        onclick={() => sendSetScene(scene.id)}
      >
        {scene.id}
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
