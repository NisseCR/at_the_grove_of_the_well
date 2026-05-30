<script lang="ts">
  import { router } from "@/stores/router.svelte";
  import ControllerView from "@/views/ControllerView.svelte";
  import PlayerView from "@/views/PlayerView.svelte";
  import HomeView from "@/views/HomeView.svelte";
</script>

{#if router.view === "player"}
  <PlayerView />
{:else if router.view === "controller"}
  <ControllerView />
{:else if router.view === "home"}
  <HomeView />
{:else}
  <!-- Future view: render a dynamic loader or a NotFound component -->
  <HomeView />
{/if}
