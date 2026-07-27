<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { page } from "$app/state";
  import { AudioLines, Link, Check, Cog } from "@lucide/svelte";
  import AudioPanel from "$lib/components/audio_panel/AudioPanel.svelte";
  import { appState } from "$lib/state/appState.svelte";
  import { connect, sendSync } from "$lib/services/transport";

  const { children } = $props();

  let panelCollapsed = $state(true);
  let copied = $state(false);

  function copyPresetUrl(): void {
    const parts: string[] = [];

    if (appState.scene?.id) {
      parts.push(`scene=${appState.scene.id}`);
    }

    if (appState.playlists.id) {
      const vol = Math.round(appState.playlists.volumeGain * 100) / 100;
      parts.push(`playlist=${appState.playlists.id}:${vol}`);
    }

    if (appState.ambiences.ids.length > 0) {
      const entries = appState.ambiences.ids.map((id) => {
        const vol =
          Math.round((appState.ambiences.volumeGains[id] ?? 1.0) * 100) / 100;
        return `${id}:${vol}`;
      });
      parts.push(`ambiences=${entries.join(",")}`);
    }

    const url = `${window.location.origin}/api/admin/apply?${parts.join("&")}`;
    navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  onMount(() => connect());
  const tab = $derived(page.url.pathname.split("/").at(2) ?? "");

  // When a new client connects, push current state to all clients.
  // Version starts at 0 so the initial effect run is a no-op.
  // untrack: prevents scene/ambiences/music from being tracked as dependencies
  // so that normal state changes don't re-trigger sendSync, which would create
  // an infinite loop via the server echo.
  $effect(() => {
    if (!appState.clientConnectedVersion) return;
    untrack(() => {
      if (
        !appState.scene &&
        !appState.handout &&
        appState.ambiences.ids.length === 0 &&
        !appState.playlists.id
      )
        return;
      sendSync();
    });
  });
</script>

<div class="controller">
  <div class="bg"></div>

  <nav class="nav">
    <div class="nav-inner">
      <h1 class="nav-title">At the Grove of the Well</h1>

      <div class="nav-tabs">
        <a href="/controller/scenes" class="tab" class:active={tab === "scenes"}
          >Scenes</a
        >
        <a href="/controller/music" class="tab" class:active={tab === "music"}
          >Music</a
        >
        <a
          href="/controller/ambiences"
          class="tab"
          class:active={tab === "ambiences"}>Ambiences</a
        >
        <a
          href="/controller/handouts"
          class="tab"
          class:active={tab === "handouts"}>Handouts</a
        >
      </div>

      <div class="nav-actions">
        <button
          class="action-btn"
          class:active={!panelCollapsed}
          onclick={() => (panelCollapsed = !panelCollapsed)}
          aria-label="Toggle audio panel"
        >
          <AudioLines size={15} />
        </button>
        <button
          class="action-btn"
          onclick={copyPresetUrl}
          aria-label="Copy preset URL"
        >
          {#if copied}
            <Check size={15} />
          {:else}
            <Link size={15} />
          {/if}
        </button>
        <a
          href="/controller/config"
          class="action-btn"
          class:active={tab === "config"}
          aria-label="Config"
        >
          <Cog size={15} />
        </a>
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

  .nav {
    position: relative;
    z-index: 1;
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border-bottom: 1px solid var(--color-border);
    padding-inline: var(--space-6);
  }

  .nav-inner {
    max-width: var(--content-max-width);
    margin-inline: auto;
    display: flex;
    align-items: stretch;
    height: 52px;
  }

  .nav-title {
    display: flex;
    align-items: center;
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: normal;
    font-style: italic;
    letter-spacing: var(--tracking-wide);
    color: var(--color-text);
    padding-right: var(--space-6);
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
  }

  .nav-tabs {
    flex: 1;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding-left: var(--space-4);
  }

  .tab {
    display: flex;
    align-items: center;
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    text-decoration: none;
    padding-inline: var(--space-2);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
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

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: var(--color-text-faint);
    cursor: pointer;
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition:
      color var(--ease-fast),
      background var(--ease-fast);
  }

  .action-btn:hover {
    color: var(--color-text);
  }

  .action-btn.active {
    color: var(--color-accent);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
  }

  .content :global(> *) {
    max-width: var(--content-max-width);
    margin-inline: auto;
  }

  .panel-backdrop {
    display: none;
  }

  @media (max-width: 640px) {
    .nav {
      padding-inline: var(--space-3);
    }

    .nav-title {
      display: none;
    }

    .nav-tabs {
      justify-content: flex-start;
    }

    .nav-actions {
      padding-left: var(--space-2);
    }

    .panel-backdrop {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 5;
      background: rgba(0, 0, 0, 0.4);
    }
  }
</style>
