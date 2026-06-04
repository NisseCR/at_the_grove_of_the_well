<script lang="ts">
  import { assetApiClient } from "@/lib/services/assetApiClient";
  import type { BrokenAsset, OrphanedFile, ReconcileResult } from "@/types/assets";

  let result = $state<ReconcileResult | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

  const isClean = $derived(
    result !== null &&
      result.orphaned_files.length === 0 &&
      result.broken_assets.length === 0
  );

  async function runReconcile() {
    loading = true;
    error = null;
    try {
      result = await assetApiClient.reconcile();
    } catch {
      error = "Reconcile failed.";
    } finally {
      loading = false;
    }
  }

  async function deleteOrphan(orphan: OrphanedFile) {
    try {
      await assetApiClient.deleteOrphan(orphan.key);
      if (result) {
        result = {
          ...result,
          orphaned_files: result.orphaned_files.filter((f) => f.key !== orphan.key),
        };
      }
    } catch {
      error = `Failed to delete orphan: ${orphan.key}`;
    }
  }

  async function deleteBroken(asset: BrokenAsset) {
    try {
      await assetApiClient.deleteBrokenAsset(asset);
      if (result) {
        result = {
          ...result,
          broken_assets: result.broken_assets.filter((a) => a.id !== asset.id),
        };
      }
    } catch {
      error = `Failed to delete record: ${asset.label}`;
    }
  }
</script>

<div class="reconcile">
  <div class="header">
    <p class="description">
      Compares R2 bucket contents against the database. Orphaned files exist in R2 with no DB
      record. Broken assets have a DB record but no file in R2.
    </p>
    <button class="run-btn" onclick={runReconcile} disabled={loading}>
      {loading ? "Running…" : "Run Reconcile"}
    </button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if result !== null}
    {#if isClean}
      <p class="clean">Everything looks good. No issues found.</p>
    {:else}
      {#if result.orphaned_files.length > 0}
        <section>
          <h3 class="section-title">Orphaned files ({result.orphaned_files.length})</h3>
          <p class="section-desc">In R2 but not referenced by any DB record.</p>
          <ul class="issue-list">
            {#each result.orphaned_files as orphan (orphan.key)}
              <li class="issue-row">
                <span class="issue-key">{orphan.key}</span>
                <button class="delete-btn" onclick={() => deleteOrphan(orphan)}>Delete</button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if result.broken_assets.length > 0}
        <section>
          <h3 class="section-title">Broken assets ({result.broken_assets.length})</h3>
          <p class="section-desc">DB records whose file is missing from R2.</p>
          <ul class="issue-list">
            {#each result.broken_assets as asset (asset.id)}
              <li class="issue-row">
                <span class="issue-type">{asset.type}</span>
                <span class="issue-label">{asset.label}</span>
                <span class="issue-key">{asset.src}</span>
                <button class="delete-btn" onclick={() => deleteBroken(asset)}>
                  Delete record
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .reconcile {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-6);
  }

  .description {
    flex: 1;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .run-btn {
    flex-shrink: 0;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-4);
    background: var(--color-glass);
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .run-btn:hover:not(:disabled) {
    color: var(--color-text);
    border-color: var(--color-accent);
  }

  .run-btn:disabled {
    opacity: 0.5;
  }

  .clean {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
  }

  .error {
    font-size: var(--text-xs);
    color: var(--color-error, #e05);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text);
  }

  .section-desc {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    margin-top: calc(-1 * var(--space-2));
  }

  .issue-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
  }

  .issue-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-glass);
  }

  .issue-type {
    font-size: var(--text-xs);
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    flex-shrink: 0;
  }

  .issue-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .issue-key {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    font-family: monospace;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .delete-btn {
    flex-shrink: 0;
    font-size: var(--text-xs);
    color: var(--color-error, #e05);
    transition: color var(--ease-fast);
  }

  .delete-btn:hover {
    color: var(--color-error-bright, #f36);
  }
</style>
