<script lang="ts">
  import { fade } from "svelte/transition";
  import { appState } from "$lib/state/appState.svelte";
</script>

{#key appState.handout?.id}
  {#if appState.handout}
    <div class="handout-overlay" transition:fade={{ duration: 400 }}>
      <img src={appState.handout.url} alt={appState.handout.label ?? ""} />
    </div>
  {/if}
{/key}

<style>
  .handout-overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-lg));
    -webkit-backdrop-filter: blur(var(--blur-lg));
    pointer-events: none;
  }

  .handout-overlay img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
  }
</style>
