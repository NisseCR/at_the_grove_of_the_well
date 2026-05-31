<script lang="ts">
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import { iconTrash, iconPencil } from "@/lib/icons";
  import type { AmbienceAsset } from "@/types/ambience";

  type PendingFile = { file: File; id: string };

  let ambiences = $state<AmbienceAsset[]>([]);
  let pending = $state<PendingFile[]>([]);
  let renamingId = $state<string | null>(null);
  let renameValue = $state("");
  let confirmingDeleteId = $state<string | null>(null);
  let error = $state<string | null>(null);
  let uploading = $state(false);

  async function load() {
    ambiences = await ambienceApiClient.fetchAmbiences();
  }

  $effect(() => {
    load();
  });

  function deriveId(filename: string): string {
    return filename
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[\s_]+/g, "-");
  }

  function onFilesSelected(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    pending = [
      ...pending,
      ...files
        .filter((f) => !pending.some((p) => p.file.name === f.name))
        .map((f) => ({ file: f, id: deriveId(f.name) })),
    ];
    input.value = "";
  }

  function removePending(index: number) {
    pending = pending.filter((_, i) => i !== index);
  }

  async function uploadAll() {
    if (pending.length === 0) return;
    uploading = true;
    error = null;
    try {
      await Promise.all(
        pending.map((p) => ambienceApiClient.uploadAmbience(p.file, p.id)),
      );
      pending = [];
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Upload failed";
    } finally {
      uploading = false;
    }
  }

  function startRename(ambience: AmbienceAsset) {
    renamingId = ambience.id;
    renameValue = ambience.id;
    error = null;
  }

  async function confirmRename(ambience: AmbienceAsset) {
    if (renameValue === ambience.id) {
      renamingId = null;
      return;
    }
    error = null;
    try {
      await ambienceApiClient.updateAmbience(ambience.id, {
        ...ambience,
        id: renameValue,
      });
      renamingId = null;
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Rename failed";
    }
  }

  async function remove(id: string) {
    error = null;
    try {
      await ambienceApiClient.deleteAmbience(id);
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Delete failed";
    }
  }
</script>

<div class="editor">
  <!-- Upload section -->
  <section class="section">
    <div class="section-header">
      <h2>Upload</h2>
    </div>

    <label class="file-picker">
      <input type="file" accept="audio/*" multiple onchange={onFilesSelected} />
      <span>Choose files…</span>
    </label>

    {#if pending.length > 0}
      <ul class="pending-list">
        {#each pending as p, i (p.file.name)}
          <li class="pending-item">
            <span class="pending-filename">{p.file.name}</span>
            <span class="pending-arrow">→</span>
            <input class="pending-id" bind:value={p.id} placeholder="id" />
            <button class="btn-icon" onclick={() => removePending(i)}>×</button>
          </li>
        {/each}
      </ul>

      <div class="upload-footer">
        {#if error}<p class="error">{error}</p>{/if}
        <button class="btn-primary" onclick={uploadAll} disabled={uploading}>
          {uploading
            ? "Uploading…"
            : `Upload ${pending.length} file${pending.length > 1 ? "s" : ""}`}
        </button>
      </div>
    {/if}
  </section>

  <!-- Existing ambiences -->
  <section class="section">
    <div class="section-header">
      <h2>Ambiences</h2>
    </div>

    {#if !error && ambiences.length === 0}
      <p class="empty">No ambiences yet.</p>
    {/if}

    <ul class="list">
      {#each ambiences as ambience (ambience.id)}
        <li class="item">
          {#if renamingId === ambience.id}
            <div class="rename-row">
              <input
                class="rename-input"
                bind:value={renameValue}
                onkeydown={(e) => {
                  if (e.key === "Enter") confirmRename(ambience);
                  if (e.key === "Escape") renamingId = null;
                }}
              />
              <button class="btn-save" onclick={() => confirmRename(ambience)}
                >Save</button
              >
              <button class="btn-muted" onclick={() => (renamingId = null)}
                >Cancel</button
              >
            </div>
          {:else}
            <div class="item-row">
              <span class="item-id">{ambience.id}</span>
              <span class="item-src">{ambience.src}</span>
              <div class="item-actions">
                <button class="btn-icon" title="Rename" onclick={() => startRename(ambience)}>
                  {@html iconPencil}
                </button>
                {#if confirmingDeleteId === ambience.id}
                  <span class="confirm-prompt">
                    <button class="btn-confirm-delete" onclick={() => remove(ambience.id)}>Delete</button>
                    <button class="btn-icon-cancel" aria-label="Cancel" onclick={() => (confirmingDeleteId = null)}>×</button>
                  </span>
                {:else}
                  <button class="btn-icon btn-icon-danger" title="Delete" onclick={() => (confirmingDeleteId = ambience.id)}>
                    {@html iconTrash}
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .section-header {
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .section-header h2 {
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  /* File picker */
  .file-picker {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }

  .file-picker input[type="file"] {
    display: none;
  }

  .file-picker span {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .file-picker:hover span {
    color: var(--color-text);
    border-color: var(--color-border-hover);
  }

  /* Pending list */
  .pending-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .pending-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .pending-filename {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pending-arrow {
    color: var(--color-text-faint);
    font-size: var(--text-xs);
    flex-shrink: 0;
  }

  .pending-id {
    width: 160px;
    flex-shrink: 0;
    background: rgba(12, 10, 18, 0.6);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    transition: border-color var(--ease-fast);
  }

  .pending-id:focus {
    outline: none;
    border-color: var(--color-accent-dim);
  }

  .upload-footer {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  /* Existing list */
  .list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .item {
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
  }

  .item-id {
    font-family: var(--font-display);
    color: var(--color-text);
    min-width: 120px;
    flex-shrink: 0;
  }

  .item-src {
    flex: 1;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-actions {
    display: flex;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  /* Rename row */
  .rename-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
  }

  .rename-input {
    flex: 1;
    background: rgba(12, 10, 18, 0.6);
    border: 1px solid var(--color-accent-dim);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
  }

  .rename-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  /* Buttons */
  .btn-primary,
  .btn-save,
  .btn-muted,
  .btn-delete,
  .btn-icon {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: transparent;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  .btn-primary {
    border-color: var(--color-accent-dim);
    color: var(--color-accent);
  }

  .btn-primary:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn-save {
    border-color: var(--color-accent-dim);
    color: var(--color-accent);
  }

  .btn-save:hover {
    border-color: var(--color-accent);
  }

  .btn-muted:hover {
    color: var(--color-text);
    border-color: var(--color-border-hover);
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    color: var(--color-text-faint);
    transition: color var(--ease-fast), border-color var(--ease-fast);
  }

  .btn-icon:hover {
    color: var(--color-text-muted);
    border-color: var(--color-border);
  }

  .btn-icon-danger:hover {
    color: #c87060;
    border-color: rgba(200, 112, 96, 0.3);
  }

  .confirm-prompt {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .btn-confirm-delete {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    border: 1px solid rgba(200, 112, 96, 0.4);
    color: #c87060;
    background: transparent;
    cursor: pointer;
    transition: border-color var(--ease-fast);
  }

  .btn-confirm-delete:hover {
    border-color: #c87060;
  }

  .btn-icon-cancel {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
  }

  .btn-icon-cancel:hover {
    color: var(--color-text-muted);
  }

  .error {
    flex: 1;
    font-size: var(--text-xs);
    color: #c87060;
  }

  .empty {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
  }
</style>
