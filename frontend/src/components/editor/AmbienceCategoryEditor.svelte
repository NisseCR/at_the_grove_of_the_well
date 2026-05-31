<script lang="ts">
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import { iconTrash, iconPencil } from "@/lib/icons";
  import ImagePicker from "@/components/editor/ImagePicker.svelte";
  import AmbiencePicker from "@/components/editor/AmbiencePicker.svelte";
  import type { AmbienceAsset, AmbienceCategory } from "@/types/ambience";

  type LinkedAmbience = { id: string; label: string; linked: boolean };

  type Draft = {
    id: string;
    src: string;
    order: number;
    ambiences: LinkedAmbience[];
  };

  let categories = $state<AmbienceCategory[]>([]);
  let allAmbiences = $state<AmbienceAsset[]>([]);
  let editingId = $state<string | null>(null);
  let creating = $state(false);
  let draft = $state<Draft>({ id: "", src: "", order: 0, ambiences: [] });
  let error = $state<string | null>(null);
  let saving = $state(false);
  let showPicker = $state(false);
  let confirmingDeleteId = $state<string | null>(null);

  async function load() {
    [categories, allAmbiences] = await Promise.all([
      ambienceApiClient.fetchAmbienceCategories(),
      ambienceApiClient.fetchAmbiences(),
    ]);
  }

  $effect(() => { load(); });

  function buildDraft(category?: AmbienceCategory): Draft {
    return {
      id: category?.id ?? "",
      src: category?.src ?? "",
      order: category?.order ?? categories.length,
      ambiences: (category?.ambiences ?? []).map((a) => ({
        id: a.id,
        label: a.label,
        linked: true,
      })),
    };
  }

  function unlinkedAmbiences(): AmbienceAsset[] {
    const linkedIds = new Set(draft.ambiences.map((a) => a.id));
    return allAmbiences.filter((a) => !linkedIds.has(a.id));
  }

  function linkAmbience(id: string) {
    draft.ambiences = [...draft.ambiences, { id, label: id, linked: true }];
  }

  function unlinkAmbience(id: string) {
    draft.ambiences = draft.ambiences.filter((a) => a.id !== id);
  }

  function startCreate() {
    creating = true;
    editingId = null;
    draft = buildDraft();
    error = null;
  }

  function startEdit(category: AmbienceCategory) {
    creating = false;
    editingId = category.id;
    draft = buildDraft(category);
    error = null;
  }

  function cancel() {
    creating = false;
    editingId = null;
    error = null;
  }

  function toCategoryPayload(): AmbienceCategory {
    return {
      id: draft.id,
      src: draft.src,
      order: draft.order,
      ambiences: draft.ambiences.map((a) => ({ id: a.id, label: a.label })),
    };
  }

  async function save() {
    saving = true;
    error = null;
    try {
      if (creating) {
        await ambienceApiClient.createCategory(toCategoryPayload());
      } else if (editingId !== null) {
        await ambienceApiClient.updateCategory(editingId, toCategoryPayload());
      }
      creating = false;
      editingId = null;
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Save failed";
    } finally {
      saving = false;
    }
  }

  async function remove(id: string) {
    confirmingDeleteId = null;
    error = null;
    try {
      await ambienceApiClient.deleteCategory(id);
      if (editingId === id) { editingId = null; creating = false; }
      await load();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : "Delete failed";
    }
  }
</script>

<div class="editor">

  <div class="list-header">
    <h2>Categories</h2>
    <button class="btn-add" onclick={startCreate} disabled={creating}>New</button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if creating}
    <div class="panel card">
      {@render editForm(null)}
    </div>
  {/if}

  <ul class="list">
    {#each categories as category (category.id)}
      <li class="item" class:open={editingId === category.id}>
        <div class="item-row">
          <div
            class="item-thumb"
            style="background-image: url('{category.url}')"
          ></div>
          <span class="item-id">{category.id}</span>
          <span class="item-order">#{category.order}</span>
          <div class="item-actions">
            <button
              class="btn-icon"
              title={editingId === category.id ? "Close" : "Edit"}
              onclick={() => editingId === category.id ? cancel() : startEdit(category)}
            >
              {#if editingId === category.id}×{:else}{@html iconPencil}{/if}
            </button>
          </div>
        </div>

        {#if editingId === category.id}
          <div class="panel">
            {@render editForm(category)}
          </div>
        {/if}
      </li>
    {/each}
  </ul>

</div>

{#if showPicker}
  <AmbiencePicker
    ambiences={unlinkedAmbiences()}
    onselect={linkAmbience}
    onclose={() => (showPicker = false)}
  />
{/if}

{#snippet editForm(category: AmbienceCategory | null)}
  <div class="form">

    <div class="form-row">
      <label class="field">
        <span>ID</span>
        <input bind:value={draft.id} placeholder="e.g. precipitation" />
      </label>
      <label class="field field-narrow">
        <span>Order</span>
        <input type="number" bind:value={draft.order} />
      </label>
    </div>

    <div class="field">
      <span class="field-label">Image</span>
      <ImagePicker
        src={draft.src}
        onpick={(src) => (draft.src = src)}
      />
    </div>

    <div class="field">
      <span class="field-label">Ambiences</span>
      {#if draft.ambiences.length > 0}
        <ul class="ambience-list">
          {#each draft.ambiences as entry (entry.id)}
            <li class="ambience-row">
              <span class="ambience-id">{entry.id}</span>
              <input class="label-input" bind:value={entry.label} placeholder="label" />
              <button class="btn-unlink" onclick={() => unlinkAmbience(entry.id)}>×</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">No ambiences linked.</p>
      {/if}
      <button class="btn-add-ambience" onclick={() => (showPicker = true)}>+ Add ambience</button>
    </div>

    <div class="form-actions">
      <button class="btn-save" onclick={save} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
      <button class="btn-muted" onclick={cancel}>Cancel</button>
      {#if category !== null}
        {#if confirmingDeleteId === category.id}
          <span class="confirm-prompt danger-offset">
            <button class="btn-confirm-delete" onclick={() => remove(category.id)}>Delete</button>
            <button class="btn-icon-cancel" aria-label="Cancel" onclick={() => (confirmingDeleteId = null)}>×</button>
          </span>
        {:else}
          <button class="btn-icon btn-icon-danger danger-offset" title="Delete category" onclick={() => (confirmingDeleteId = category.id)}>
            {@html iconTrash}
          </button>
        {/if}
      {/if}
    </div>

  </div>
{/snippet}

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .list-header h2 {
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

  /* Category list */
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
    overflow: hidden;
    transition: border-color var(--ease-fast);
  }

  .item.open {
    border-color: var(--color-border-hover);
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-4);
  }

  .item-thumb {
    width: 60px;
    height: 38px;
    border-radius: var(--radius-sm);
    background-size: cover;
    background-position: center;
    filter: saturate(var(--image-saturation));
    flex-shrink: 0;
  }

  .item-id {
    font-family: var(--font-display);
    color: var(--color-text);
    flex: 1;
  }

  .item-order {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    min-width: 28px;
  }

  .item-actions {
    display: flex;
    gap: var(--space-2);
  }

  /* Edit panel */
  .panel {
    border-top: 1px solid var(--color-border);
  }

  .panel.card {
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  /* Form */
  .form {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .form-row {
    display: flex;
    gap: var(--space-4);
    align-items: flex-end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .field-narrow {
    flex: 0 0 72px;
  }

  .field-label,
  .field span:first-child {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  input[type="text"],
  input[type="number"],
  input:not([type="checkbox"]):not([type="file"]) {
    background: rgba(12, 10, 18, 0.6);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    width: 100%;
    transition: border-color var(--ease-fast);
  }

  input:not([type="checkbox"]):not([type="file"]):focus {
    outline: none;
    border-color: var(--color-accent-dim);
  }

  /* Ambience linker */
  .ambience-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .ambience-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .ambience-id {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    min-width: 120px;
    flex-shrink: 0;
  }

  .label-input {
    flex: 1;
    max-width: 200px;
  }

  .btn-unlink {
    font-size: var(--text-base);
    color: var(--color-text-faint);
    line-height: 1;
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
    flex-shrink: 0;
  }

  .btn-unlink:hover {
    color: #c87060;
  }

  .btn-add-ambience {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    transition: color var(--ease-fast);
    text-align: left;
  }

  .btn-add-ambience:hover {
    color: var(--color-text);
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
    transition: color var(--ease-fast), border-color var(--ease-fast);
  }

  .btn-confirm-delete:hover {
    border-color: #c87060;
  }

  /* Actions */
  .form-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .danger-offset {
    margin-left: auto;
  }

  .btn-add,
  .btn-save,
  .btn-muted {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: transparent;
    transition: color var(--ease-fast), border-color var(--ease-fast);
  }

  .btn-add:hover,
  .btn-muted:hover {
    color: var(--color-text);
    border-color: var(--color-border-hover);
  }

  .btn-save {
    border-color: var(--color-accent-dim);
    color: var(--color-accent);
  }

  .btn-save:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  .btn-save:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn-add:disabled {
    opacity: 0.4;
    cursor: default;
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
    font-size: var(--text-sm);
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

  .empty {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
  }
</style>
