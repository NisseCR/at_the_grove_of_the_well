<script lang="ts">
  import { Tabs } from "bits-ui";
  import { navigate } from "@/stores/router.svelte";
  import AssetLibrary from "@/components/editor/AssetLibrary.svelte";

  type EditorTab = "library" | "scenes" | "playlists" | "ambiences";

  let activeTab = $state<EditorTab>("library");
</script>

<div class="editor">
  <div class="bg"></div>

  <nav class="topnav">
    <button class="back" onclick={() => navigate("home")}>← Home</button>

    <Tabs.Root bind:value={activeTab} class="tabs-root">
      <Tabs.List class="tab-list">
        <Tabs.Trigger value="library" class="tab">Library</Tabs.Trigger>
        <Tabs.Trigger value="scenes" class="tab">Scenes</Tabs.Trigger>
        <Tabs.Trigger value="playlists" class="tab">Playlists</Tabs.Trigger>
        <Tabs.Trigger value="ambiences" class="tab">Ambiences</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </nav>

  <div class="main">
    <div class="content">
      <div class="inner">
        {#if activeTab === "library"}
          <AssetLibrary />
        {:else if activeTab === "scenes"}
          <p class="placeholder">Scene editor — coming soon</p>
        {:else if activeTab === "playlists"}
          <p class="placeholder">Playlist editor — coming soon</p>
        {:else if activeTab === "ambiences"}
          <p class="placeholder">Ambience editor — coming soon</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .editor {
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

  .topnav {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6) 0;
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border-bottom: 1px solid var(--color-border);
  }

  .back {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    padding: var(--space-2) var(--space-3);
    padding-bottom: var(--space-3);
    transition: color var(--ease-fast);
    white-space: nowrap;
    background: none;
    border: none;
    cursor: pointer;
  }

  .back:hover {
    color: var(--color-text-muted);
  }

  :global(.tabs-root) {
    flex: 1;
  }

  :global(.tab-list) {
    display: flex;
    gap: var(--space-1);
  }

  :global(.tab) {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    padding: var(--space-2) var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    cursor: pointer;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  :global(.tab:hover) {
    color: var(--color-text);
  }

  :global(.tab[data-state="active"]) {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  .main {
    position: relative;
    z-index: 1;
    flex: 1;
    overflow: hidden;
  }

  .content {
    height: 100%;
    overflow-y: auto;
    padding: var(--space-6);
    padding-top: var(--space-8);
  }

  .inner {
    max-width: 1100px;
    margin-inline: auto;
    width: 100%;
  }

  .placeholder {
    color: var(--color-text-faint);
    font-style: italic;
  }
</style>
