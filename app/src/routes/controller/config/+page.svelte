<script lang="ts">
  import { Tabs } from "bits-ui";
  import { appState } from "$lib/state/appState.svelte";
  import { sendSetDebug } from "$lib/services/transport";
  import { toast } from "svelte-sonner";

  $effect(() => {
    sendSetDebug(appState.debug);
  });

  interface SyncResult {
    last_synced: string;
    ambience_categories: number;
    ambiences: number;
    playlist_categories: number;
    playlists: number;
    scene_categories: number;
    scenes: number;
  }

  let syncing = $state(false);
  let syncResult = $state<SyncResult | null>(null);

  async function sync() {
    syncing = true;
    syncResult = null;
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      syncResult = await res.json();
      toast.success(
        `Synced — ${syncResult!.scenes} scenes, ${syncResult!.ambiences} ambiences`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      syncing = false;
    }
  }
</script>

<Tabs.Root value="debug" class="config">
  <Tabs.List class="config-tabs">
    <Tabs.Trigger value="debug" class="config-tab">Debug</Tabs.Trigger>
    <Tabs.Trigger value="sync" class="config-tab">Sync</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="debug" class="config-section">
    <h2 class="section-title">Debug</h2>
    <label class="setting">
      <span class="setting-label">Show debug overlay on player</span>
      <input type="checkbox" bind:checked={appState.debug} />
    </label>
  </Tabs.Content>

  <Tabs.Content value="sync" class="config-section">
    <h2 class="section-title">Sync</h2>
    <p class="section-desc">
      Scans R2 for ambiences and playlists, and reloads scene configs.
    </p>
    <button class="sync-btn" onclick={sync} disabled={syncing}>
      {syncing ? "Syncing…" : "Sync Now"}
    </button>
    {#if syncResult}
      <table>
        <tbody>
          <tr
            ><td>Ambience categories</td><td
              >{syncResult.ambience_categories}</td
            ></tr
          >
          <tr><td>Ambiences</td><td>{syncResult.ambiences}</td></tr>
          <tr
            ><td>Playlist categories</td><td
              >{syncResult.playlist_categories}</td
            ></tr
          >
          <tr><td>Playlists</td><td>{syncResult.playlists}</td></tr>
          <tr
            ><td>Scene categories</td><td>{syncResult.scene_categories}</td></tr
          >
          <tr><td>Scenes</td><td>{syncResult.scenes}</td></tr>
        </tbody>
      </table>
      <p class="synced-at">
        Last synced: {new Date(syncResult.last_synced).toLocaleString()}
      </p>
    {/if}
  </Tabs.Content>
</Tabs.Root>

<style>
  :global(.config) {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  :global(.config-tabs) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border);
  }

  :global(.config-tab) {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-faint);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  :global(.config-tab:hover) {
    color: var(--color-text-muted);
  }

  :global(.config-tab[data-state="active"]) {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  :global(.config-section) {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.config-section[hidden]) {
    display: none;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  .section-desc {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    cursor: pointer;
  }

  .setting-label {
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .sync-btn {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text);
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-6);
    cursor: pointer;
    transition: opacity var(--ease-fast);
    align-self: flex-start;
  }

  .sync-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sync-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  td {
    padding: var(--space-2) 0;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
  }

  td:last-child {
    text-align: right;
    color: var(--color-text);
  }

  .synced-at {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    margin: 0;
  }
</style>
