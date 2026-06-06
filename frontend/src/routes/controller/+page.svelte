<script lang="ts">
  import Scenes from "./Scenes.svelte";
  import Ambiences from "./Ambiences.svelte";
  import Music from "./Music.svelte";
  import AudioPanel from "./AudioPanel.svelte";
  import Config from "./Config.svelte";
  import { AudioLines } from "@lucide/svelte";

  const projectName = import.meta.env.VITE_PROJECT_NAME as string;

  type Tab = "scenes" | "ambiences" | "music" | "config";
  let activeTab = $state<Tab>("scenes");

  let panelCollapsed = $state(true);
</script>

<div class="controller">
  <div class="bg"></div>

  <nav class="tabs">
    <div class="tabs-inner">
      <h1 class="project-title">{projectName}</h1>
      <div class="tab-row">
        <button
          class="tab"
          class:active={activeTab === "scenes"}
          onclick={() => (activeTab = "scenes")}
        >
          Scenes
        </button>
        <button
          class="tab"
          class:active={activeTab === "music"}
          onclick={() => (activeTab = "music")}
        >
          Music
        </button>
        <button
          class="tab"
          class:active={activeTab === "ambiences"}
          onclick={() => (activeTab = "ambiences")}
        >
          Ambiences
        </button>
        <button
          class="tab"
          class:active={activeTab === "config"}
          onclick={() => (activeTab = "config")}
        >
          Config
        </button>
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
      {#if activeTab === "scenes"}
        <Scenes />
      {:else if activeTab === "music"}
        <Music />
      {:else if activeTab === "ambiences"}
        <Ambiences />
      {:else if activeTab === "config"}
        <Config />
      {/if}
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
