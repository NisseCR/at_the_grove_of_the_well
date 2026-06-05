<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import { router } from "@/stores/router.svelte";
  import ControllerView from "@/views/ControllerView.svelte";
  import PlayerView from "@/views/PlayerView.svelte";
  import HomeView from "@/views/HomeView.svelte";
  import EditorView from "@/views/EditorView.svelte";
</script>

<Toaster theme="dark" position="bottom-right" richColors />

{#if router.view === "player"}
  <PlayerView />
{:else if router.view === "controller"}
  <ControllerView />
{:else if router.view === "editor"}
  <EditorView />
{:else}
  <HomeView />
{/if}
