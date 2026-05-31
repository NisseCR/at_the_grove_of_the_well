<script lang="ts">
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceAsset } from "@/types/ambience";

  let ambiences = $state<AmbienceAsset[]>([]);
  let editingId = $state<string | null>(null);
  let creating = $state(false);

  let draft = $state({ id: "", src: "" });
  let error = $state<string | null>(null);

  async function load() {
    ambiences = await ambienceApiClient.fetchAmbiencesRaw();
  }

  $effect(() => { load(); });

  function startCreate() {
    editingId = null;
    draft = { id: "", src: "" };
    error = null;
    creating = true;
  }

  function startEdit(ambience: AmbienceAsset) {
    creating = false;
    error = null;
    draft = { id: ambience.id, src: ambience.src };
    editingId = ambience.id;
  }

  function cancel() {
    creating = false;
    editingId = null;
    error = null;
  }

  async function save() {
    error = null;
    try {
      if (creating) {
        await ambienceApiClient.createAmbience(draft);
      } else if (editingId !== null) {
        await ambienceApiClient.updateAmbience(editingId, draft);
      }
      creating = false;
      editingId = null;
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Save failed";
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

<div class="section">
  <div class="section-header">
    <h2>Ambiences</h2>
    <button class="btn-add" onclick={startCreate} disabled={creating}>New</button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if creating}
    <div class="form">
      <div class="form-row">
        <label>
          <span>ID</span>
          <input bind:value={draft.id} placeholder="e.g. rain" />
        </label>
        <label>
          <span>Src</span>
          <input bind:value={draft.src} placeholder="assets/audio/ambience/rain.ogg" />
        </label>
      </div>
      <div class="form-actions">
        <button class="btn-save" onclick={save}>Save</button>
        <button class="btn-cancel" onclick={cancel}>Cancel</button>
      </div>
    </div>
  {/if}

  <ul class="list">
    {#each ambiences as ambience (ambience.id)}
      <li class="item">
        {#if editingId === ambience.id}
          <div class="form">
            <div class="form-row">
              <label>
                <span>ID</span>
                <input bind:value={draft.id} />
              </label>
              <label>
                <span>Src</span>
                <input bind:value={draft.src} />
              </label>
            </div>
            <div class="form-actions">
              <button class="btn-save" onclick={save}>Save</button>
              <button class="btn-cancel" onclick={cancel}>Cancel</button>
            </div>
          </div>
        {:else}
          <div class="item-row">
            <span class="item-id">{ambience.id}</span>
            <span class="item-src">{ambience.src}</span>
            <div class="item-actions">
              <button class="btn-edit" onclick={() => startEdit(ambience)}>Edit</button>
              <button class="btn-delete" onclick={() => remove(ambience.id)}>Delete</button>
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .section-header h2 {
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .error {
    font-size: var(--text-xs);
    color: #c87060;
    padding: var(--space-2) var(--space-3);
    background: rgba(200, 112, 96, 0.08);
    border: 1px solid rgba(200, 112, 96, 0.2);
    border-radius: var(--radius-sm);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
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

  /* Form */
  .form {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .form-row {
    display: flex;
    gap: var(--space-4);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
  }

  label span {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  input {
    background: rgba(12, 10, 18, 0.6);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--ease-fast);
    width: 100%;
  }

  input:focus {
    outline: none;
    border-color: var(--color-accent-dim);
  }

  .form-actions {
    display: flex;
    gap: var(--space-2);
  }

  /* Buttons */
  .btn-add,
  .btn-save,
  .btn-cancel,
  .btn-edit,
  .btn-delete {
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

  .btn-add:hover,
  .btn-edit:hover,
  .btn-save:hover {
    color: var(--color-text);
    border-color: var(--color-border-hover);
  }

  .btn-save {
    border-color: var(--color-accent-dim);
    color: var(--color-accent);
  }

  .btn-save:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .btn-delete:hover {
    color: #c87060;
    border-color: rgba(200, 112, 96, 0.4);
  }

  .btn-add:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
