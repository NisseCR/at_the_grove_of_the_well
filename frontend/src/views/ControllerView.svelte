<script lang="ts">
  import Scenes from "@/components/controller/Scenes.svelte";
  import Ambiences from "@/components/controller/Ambiences.svelte";
  import Music from "@/components/controller/Music.svelte";
  import AudioPanel from "@/components/controller/AudioPanel.svelte";

  type Tab = "scenes" | "ambiences" | "music";
  let activeTab = $state<Tab>("scenes");
</script>

<div class="controller">
  <!-- Blurred art background -->
  <div class="bg"></div>

  <nav class="tabs">
    <button
      class="tab"
      class:active={activeTab === "scenes"}
      onclick={() => (activeTab = "scenes")}
    >
      Scenes
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
      class:active={activeTab === "music"}
      onclick={() => (activeTab = "music")}
    >
      Music
    </button>
  </nav>

  <div class="main">
    <div class="content">
      {#if activeTab === "scenes"}
        <Scenes />
      {:else if activeTab === "ambiences"}
        <Ambiences />
      {:else if activeTab === "music"}
        <Music />
      {/if}
    </div>
    <AudioPanel />
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

  /* Background image, blurred and darkened to serve as an art backdrop.
     scale(1.05) prevents the blur from revealing transparent edges.       */
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

  /* Tab bar */
  .tabs {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-4) var(--space-6) 0;
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border-bottom: 1px solid var(--color-border);
  }

  .tab {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    padding: var(--space-2) var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px; /* overlap the tabs border-bottom */
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

  /* Row below the tab bar — content + side panel */
  .main {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* Scrollable tab content */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
    padding-top: var(--space-10);
  }

  /* Constrain tab content width and center it */
  .content :global(> *) {
    max-width: var(--content-max-width);
    margin-inline: auto;
  }
</style>
