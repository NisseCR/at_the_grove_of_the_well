<script lang="ts">
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { AmbienceCategory, AmbienceCategoryEntry } from "@/types/ambience";

  type DraftCategory = {
    id: string;
    src: string;
    order: number;
    ambiences: AmbienceCategoryEntry[];
  };

  let categories = $state<AmbienceCategory[]>([]);
  let editingId = $state<string | null>(null);
  let creating = $state(false);

  let draft = $state<DraftCategory>({ id: "", src: "", order: 0, ambiences: [] });
  let error = $state<string | null>(null);

  async function load() {
    categories = await ambienceApiClient.fetchAmbienceCategoriesRaw();
  }

  $effect(() => { load(); });

  function emptyDraft(): DraftCategory {
    return { id: "", src: "", order: 0, ambiences: [] };
  }

  function startCreate() {
    editingId = null;
    draft = emptyDraft();
    error = null;
    creating = true;
  }

  function startEdit(category: AmbienceCategory) {
    creating = false;
    error = null;
    draft = {
      id: category.id,
      src: category.src,
      order: category.order,
      ambiences: category.ambiences.map((a) => ({ ...a })),
    };
    editingId = category.id;
  }

  function cancel() {
    creating = false;
    editingId = null;
    error = null;
  }

  function addEntry() {
    draft.ambiences = [...draft.ambiences, { id: "", label: "" }];
  }

  function removeEntry(index: number) {
    draft.ambiences = draft.ambiences.filter((_, i) => i !== index);
  }

  async function save() {
    error = null;
    try {
      if (creating) {
        await ambienceApiClient.createCategory(draft);
      } else if (editingId !== null) {
        await ambienceApiClient.updateCategory(editingId, draft);
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
      await ambienceApiClient.deleteCategory(id);
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Delete failed";
    }
  }
</script>

<div class="section">
  <div class="section-header">
    <h2>Categories</h2>
    <button class="btn-add" onclick={startCreate} disabled={creating}>New</button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if creating}
    <div class="form card">
      <div class="form-fields">
        <label>
          <span>ID</span>
          <input bind:value={draft.id} placeholder="e.g. precipitation" />
        </label>
        <label>
          <span>Image src</span>
          <input bind:value={draft.src} placeholder="assets/images/rainclouds.jpg" />
        </label>
        <label class="label-narrow">
          <span>Order</span>
          <input type="number" bind:value={draft.order} />
        </label>
      </div>

      <div class="entries-section">
        <div class="entries-header">
          <span>Ambiences</span>
          <button class="btn-add-entry" onclick={addEntry}>+ Add</button>
        </div>
        {#each draft.ambiences as entry, i (i)}
          <div class="entry-row">
            <input bind:value={entry.id} placeholder="ambience id" />
            <input bind:value={entry.label} placeholder="label" />
            <button class="btn-remove-entry" onclick={() => removeEntry(i)}>×</button>
          </div>
        {/each}
      </div>

      <div class="form-actions">
        <button class="btn-save" onclick={save}>Save</button>
        <button class="btn-cancel" onclick={cancel}>Cancel</button>
      </div>
    </div>
  {/if}

  <ul class="list">
    {#each categories as category (category.id)}
      <li class="item">
        {#if editingId === category.id}
          <div class="form">
            <div class="form-fields">
              <label>
                <span>ID</span>
                <input bind:value={draft.id} />
              </label>
              <label>
                <span>Image src</span>
                <input bind:value={draft.src} />
              </label>
              <label class="label-narrow">
                <span>Order</span>
                <input type="number" bind:value={draft.order} />
              </label>
            </div>

            <div class="entries-section">
              <div class="entries-header">
                <span>Ambiences</span>
                <button class="btn-add-entry" onclick={addEntry}>+ Add</button>
              </div>
              {#each draft.ambiences as entry, i (i)}
                <div class="entry-row">
                  <input bind:value={entry.id} placeholder="ambience id" />
                  <input bind:value={entry.label} placeholder="label" />
                  <button class="btn-remove-entry" onclick={() => removeEntry(i)}>×</button>
                </div>
              {/each}
            </div>

            <div class="form-actions">
              <button class="btn-save" onclick={save}>Save</button>
              <button class="btn-cancel" onclick={cancel}>Cancel</button>
            </div>
          </div>
        {:else}
          <div class="item-row">
            <span class="item-id">{category.id}</span>
            <span class="item-order">#{category.order}</span>
            <span class="item-count">{category.ambiences.length} ambiences</span>
            <div class="item-actions">
              <button class="btn-edit" onclick={() => startEdit(category)}>Edit</button>
              <button class="btn-delete" onclick={() => remove(category.id)}>Delete</button>
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

  .item-order {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    min-width: 32px;
  }

  .item-count {
    flex: 1;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
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
    gap: var(--space-4);
  }

  .form.card {
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .form-fields {
    display: flex;
    gap: var(--space-4);
    align-items: flex-end;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
  }

  label.label-narrow {
    flex: 0 0 80px;
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

  /* Entries sub-section */
  .entries-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .entries-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  .entry-row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .entry-row input {
    flex: 1;
  }

  .btn-remove-entry {
    font-size: var(--text-base);
    color: var(--color-text-faint);
    line-height: 1;
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
    flex-shrink: 0;
  }

  .btn-remove-entry:hover {
    color: #c87060;
  }

  .btn-add-entry {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    transition: color var(--ease-fast);
  }

  .btn-add-entry:hover {
    color: var(--color-text);
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
  .btn-edit:hover {
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
