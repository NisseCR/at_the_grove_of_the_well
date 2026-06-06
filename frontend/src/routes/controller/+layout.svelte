<script lang="ts">
  import { untrack } from "svelte";
  import { page } from "$app/state";
  import { AudioLines } from "@lucide/svelte";
  import AudioPanel from "./AudioPanel.svelte";
  import { appState } from "$lib/stores/appState.svelte";
  import { sendSync } from "$lib/services/transport";

  const { children } = $props();
  const projectName = import.meta.env.VITE_PROJECT_NAME as string;

  let panelCollapsed = $state(true);
  const tab = $derived(page.url.pathname.split("/").at(2) ?? "");

  // When a new client connects, push current state to all clients.
  // Version starts at 0 so the initial effect run is a no-op.
  // untrack: prevents scene/ambiences/music from being tracked as dependencies
  // so that normal state changes don't re-trigger sendSync, which would create
  // an infinite loop via the server echo.
  $effect(() => {
    if (!appState.clientConnectedVersion) return;
    untrack(() => {
      if (!appState.scene && !appState.ambiences && !appState.music) return;
      sendSync();
    });
  });
</script>

<div class="controller">
  <div class="bg"></div>

  <nav class="tabs">
    <div class="tabs-inner">
      <h1 class="project-title">{projectName}</h1>
      <div class="tab-row">
        <a
          href="/controller/scenes"
          class="tab"
          class:active={tab === "scenes"}
        >
          Scenes
        </a>
        <a
          href="/controller/music"
          class="tab"
          class:active={tab === "music"}
        >
          Music
        </a>
        <a
          href="/controller/ambiences"
          class="tab"
          class:active={tab === "ambiences"}
        >
          Ambiences
        </a>
        <a
          href="/controller/config"
          class="tab"
          class:active={tab === "config"}
        >
          Config
        </a>
        <button
          class="tab audio-toggle"
          class:active={!panelCollapsed}
          onclick={() => (panelCollapsed = !panelCollapsed)}
          aria-label="Toggle audio panel"
        >
          <AudioLines size={15} />
        </button>
      </div>
    </div>
  </nav>

  <div class="main">
    <div class="content">
      {@render children()}
    </div>
    {#if !panelCollapsed}
      <button
        class="panel-backdrop"
        onclick={() => (panelCollapsed = true)}
        aria-label="Close audio panel"
      ></button>
    {/if}
    <AudioPanel bind:collapsed={panelCollapsed} />
  </div>
</div>

<style>
  .controller {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .bg {
    position: absolute;
    inset: 0;
    background-image: url("/controller-background.jpg");
    background-size: cover;
    background-position: center;
    filter: blur(var(--blur-bg)) brightness(0.35);
    transform: scale(1.08);
    z-index: 0;
  }

  .main {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .tabs {
    position: relative;
    z-index: 1;
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border-bottom: 1px solid var(--color-border);
    padding-inline: var(--space-6);
  }

  .tabs-inner {
    max-width: var(--content-max-width);
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-top: var(--space-4);
  }

  .project-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: normal;
    font-style: italic;
    letter-spacing: var(--tracking-wide);
    color: var(--color-text);
    padding-bottom: var(--space-3);
  }

  .tab-row {
    display: flex;
    gap: var(--space-1);
  }

  .tab {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .tab:hover {
    color: var(--color-text);
  }

  .tab.active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
    padding-top: var(--space-10);
  }

  .content :global(> *) {
    max-width: var(--content-max-width);
    margin-inline: auto;
  }

  .panel-backdrop {
    display: none;
  }

  @media (max-width: 640px) {
    .panel-backdrop {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 5;
      background: rgba(0, 0, 0, 0.4);
    }

    .project-title {
      font-size: var(--text-base);
      font-style: normal;
      padding-bottom: var(--space-2);
    }
  }

  .audio-toggle {
    display: flex;
    align-items: center;
  }
</style>
