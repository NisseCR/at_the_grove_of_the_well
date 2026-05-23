<script lang="ts">
  import { viewStore } from "@/lib/router";
  import ControllerView from "@/views/ControllerView.svelte";
  import PlayerView from "@/views/PlayerView.svelte";
  import HomeView from "@/views/HomeView.svelte";

  // ` $viewStore ` is reactive and will update on history navigation
  $: current = $viewStore;
</script>

{#if current === "player"}
  <PlayerView />
{:else if current === "controller"}
  <ControllerView />
{:else if current === "home"}
  <HomeView />
{:else}
  <!-- Future view: you can render a dynamic loader or a NotFound component -->
  <HomeView />
{/if}
