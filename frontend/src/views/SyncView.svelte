<script lang="ts">
  import { navigate } from "@/stores/router.svelte";
  import { adminApiClient } from "@/lib/services/adminApiClient";
  import type { SyncResult } from "@/lib/services/adminApiClient";

  let syncing = $state(false);
  let result = $state<SyncResult | null>(null);
  let error = $state<string | null>(null);

  async function sync() {
    syncing = true;
    error = null;
    result = null;
    try {
      result = await adminApiClient.sync();
    } catch (e) {
      error = e instanceof Error ? e.message : "Sync failed";
    } finally {
      syncing = false;
    }
  }
</script>

<div class="sync-view">
  <div class="bg"></div>

  <nav class="topnav">
    <button class="back" onclick={() => navigate("home")}>← Home</button>
    <span class="title">Sync</span>
  </nav>

  <div class="main">
    <div class="card">
      <p class="description">
        Scans R2 for ambiences and playlists, and reloads scene configs from disk.
      </p>

      <button class="sync-btn" onclick={sync} disabled={syncing}>
        {syncing ? "Syncing…" : "Sync Now"}
      </button>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      {#if result}
        <div class="result">
          <p class="synced-at">Last synced: {new Date(result.last_synced).toLocaleString()}</p>
          <table>
            <tbody>
              <tr><td>Ambience categories</td><td>{result.ambience_categories}</td></tr>
              <tr><td>Ambiences</td><td>{result.ambiences}</td></tr>
              <tr><td>Playlist categories</td><td>{result.playlist_categories}</td></tr>
              <tr><td>Playlists</td><td>{result.playlists}</td></tr>
              <tr><td>Scene categories</td><td>{result.scene_categories}</td></tr>
              <tr><td>Scenes</td><td>{result.scenes}</td></tr>
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sync-view {
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
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6);
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
    transition: color var(--ease-fast);
    background: none;
    border: none;
    cursor: pointer;
  }

  .back:hover {
    color: var(--color-text-muted);
  }

  .title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
  }

  .main {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--space-12) var(--space-6);
  }

  .card {
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .description {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
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

  .error {
    font-size: var(--text-sm);
    color: var(--color-error, #f87171);
    margin: 0;
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .synced-at {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    margin: 0;
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
</style>
