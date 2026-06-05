<script lang="ts">
  import { Tabs } from "bits-ui";
  import { AudioWaveform } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { Ambience, AmbienceCategory } from "@/types/ambience";
  import ConfirmDialog from "@/components/editor/ConfirmDialog.svelte";
  import AmbienceForm from "@/components/editor/AmbienceForm.svelte";
  import CategoryForm from "@/components/editor/CategoryForm.svelte";
  import ItemPickerDialog from "@/components/editor/ItemPickerDialog.svelte";
  import SearchInput from "@/components/editor/SearchInput.svelte";

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let ambiences = $state<Ambience[]>([]);
  let categories = $state<AmbienceCategory[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let deleting = $state(false);

  let activeTab = $state<"ambiences" | "categories">("ambiences");
  let searchQuery = $state("");
  let catPickerOpenId = $state<string | null>(null);
  let catPickerOpen = $state(false);

  const pickerCat = $derived(categories.find((c) => c.id === catPickerOpenId) ?? null);
  const pickerAmbiences = $derived(
    pickerCat ? ambiencesNotInCategory(pickerCat).map((a) => ({ id: a.id, label: a.label })) : [],
  );

  $effect(() => {
    if (!catPickerOpen) catPickerOpenId = null;
  });

  // Ambience dialogs
  let formOpen = $state(false);
  let editTarget = $state<Ambience | null>(null);
  let deleteTarget = $state<Ambience | null>(null);
  let deleteOpen = $state(false);

  // Category dialogs
  let catFormOpen = $state(false);
  let catEditTarget = $state<AmbienceCategory | null>(null);
  let catDeleteTarget = $state<AmbienceCategory | null>(null);
  let catDeleteOpen = $state(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /** Load both ambiences and categories on mount. */
  async function load() {
    loading = true;
    try {
      [ambiences, categories] = await Promise.all([
        ambienceApiClient.fetchAmbiences(),
        ambienceApiClient.fetchAmbienceCategories(),
      ]);
    } catch {
      toast.error("Failed to load ambiences");
    } finally {
      loading = false;
    }
  }

  $effect(() => { load(); });

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  /** Returns ambiences filtered by the current search query. */
  function filteredAmbiences(): Ambience[] {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ambiences;
    return ambiences.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.audio_asset_label?.toLowerCase().includes(q) ?? false),
    );
  }

  // ---------------------------------------------------------------------------
  // Ambience CRUD
  // ---------------------------------------------------------------------------

  /** Opens the create form. */
  function openCreate() {
    editTarget = null;
    formOpen = true;
  }

  /** Opens the edit form pre-filled with the given ambience. */
  function openEdit(ambience: Ambience) {
    editTarget = ambience;
    formOpen = true;
  }

  /** Opens the delete confirmation for the given ambience. */
  function openDelete(ambience: Ambience) {
    deleteTarget = ambience;
    deleteOpen = true;
  }

  /** Creates or updates an ambience, then updates the local list. */
  async function handleSave(data: {
    label: string;
    slug: string;
    volume: number;
    loop: boolean;
    audio_asset_id: string | null;
  }) {
    saving = true;
    try {
      const payload = {
        label: data.label,
        slug: data.slug || undefined,
        volume: data.volume,
        loop: data.loop,
        audio_asset_id: data.audio_asset_id ?? undefined,
      };

      if (editTarget) {
        const updated = await ambienceApiClient.patchAmbience(editTarget.id, payload);
        ambiences = ambiences.map((a) => (a.id === updated.id ? updated : a));
        toast.success("Ambience updated");
      } else {
        const created = await ambienceApiClient.createAmbience(payload);
        ambiences = [...ambiences, created].sort((a, b) => a.label.localeCompare(b.label));
        toast.success("Ambience created");
      }

      formOpen = false;
      editTarget = null;
    } catch {
      toast.error("Failed to save ambience");
    } finally {
      saving = false;
    }
  }

  /** Deletes the targeted ambience. */
  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await ambienceApiClient.deleteAmbience(deleteTarget.id);
      ambiences = ambiences.filter((a) => a.id !== deleteTarget!.id);
      // Remove from categories list too
      categories = categories.map((c) => ({
        ...c,
        ambiences: c.ambiences.filter((e) => e.id !== deleteTarget!.id),
      }));
      toast.success("Ambience deleted");
      deleteOpen = false;
      deleteTarget = null;
    } catch {
      toast.error("Failed to delete ambience");
    } finally {
      deleting = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Category CRUD
  // ---------------------------------------------------------------------------

  function openCatCreate() {
    catEditTarget = null;
    catFormOpen = true;
  }

  function openCatEdit(cat: AmbienceCategory) {
    catEditTarget = cat;
    catFormOpen = true;
  }

  function openCatDelete(cat: AmbienceCategory) {
    catDeleteTarget = cat;
    catDeleteOpen = true;
  }

  /** Creates or updates a category. */
  async function handleCatSave(data: {
    label: string;
    display_order: number;
    thumb_id: string | null;
  }) {
    saving = true;
    try {
      const patch = {
        label: data.label,
        display_order: data.display_order,
        ...(data.thumb_id !== null ? { thumb_id: data.thumb_id || undefined } : {}),
      };

      if (catEditTarget) {
        const updated = await ambienceApiClient.patchCategory(catEditTarget.id, patch);
        categories = categories.map((c) => (c.id === updated.id ? updated : c));
        toast.success("Category updated");
      } else {
        const created = await ambienceApiClient.createCategory(patch);
        categories = [...categories, created].sort((a, b) => a.order - b.order);
        toast.success("Category created");
      }

      catFormOpen = false;
      catEditTarget = null;
    } catch {
      toast.error("Failed to save category");
    } finally {
      saving = false;
    }
  }

  /** Deletes the targeted category. */
  async function handleCatDelete() {
    if (!catDeleteTarget) return;
    deleting = true;
    try {
      await ambienceApiClient.deleteCategory(catDeleteTarget.id);
      categories = categories.filter((c) => c.id !== catDeleteTarget!.id);
      toast.success("Category deleted");
      catDeleteOpen = false;
      catDeleteTarget = null;
    } catch {
      toast.error("Failed to delete category");
    } finally {
      deleting = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Category ↔ Ambience linking
  // ---------------------------------------------------------------------------

  /** Add an ambience to a category and update the local categories list. */
  async function addToCategory(catId: string, ambienceId: string, ambienceLabel: string) {
    try {
      await ambienceApiClient.addAmbienceToCategory(catId, ambienceId);
      categories = categories.map((c) =>
        c.id === catId
          ? { ...c, ambiences: [...c.ambiences, { id: ambienceId, label: ambienceLabel }] }
          : c,
      );
      toast.success(`Added to category`);
    } catch {
      toast.error("Failed to add ambience to category");
    }
  }

  /** Remove an ambience from a category and update the local categories list. */
  async function removeFromCategory(catId: string, ambienceId: string) {
    try {
      await ambienceApiClient.removeAmbienceFromCategory(catId, ambienceId);
      categories = categories.map((c) =>
        c.id === catId
          ? { ...c, ambiences: c.ambiences.filter((e) => e.id !== ambienceId) }
          : c,
      );
      toast.success("Removed from category");
    } catch {
      toast.error("Failed to remove ambience from category");
    }
  }

  /** Picks an item from the picker and links it to the open category. */
  function handleCatPick(item: { id: string; label: string }) {
    if (catPickerOpenId) addToCategory(catPickerOpenId, item.id, item.label);
    catPickerOpen = false;
  }

  /**
   * Returns ambiences not yet in the given category,
   * for use in the "add" dropdown.
   */
  function ambiencesNotInCategory(cat: AmbienceCategory): Ambience[] {
    const linked = new Set(cat.ambiences.map((e) => e.id));
    return ambiences.filter((a) => !linked.has(a.id));
  }
</script>

<div class="editor">
  <Tabs.Root bind:value={activeTab} class="editor-tabs">
    <div class="editor-header">
      <Tabs.List class="editor-tab-list">
        <Tabs.Trigger value="ambiences" class="editor-tab">Ambiences</Tabs.Trigger>
        <Tabs.Trigger value="categories" class="editor-tab">Categories</Tabs.Trigger>
      </Tabs.List>
    </div>

  </Tabs.Root>

  <!-- Content rendered with {#if} so only the active tab is mounted -->
  {#if activeTab === "ambiences"}
    <div class="tab-body">
      {#if loading}
        <p class="status">Loading…</p>
      {:else}
        <div class="toolbar">
          <SearchInput bind:value={searchQuery} placeholder="Search by label or audio asset…" />
          <button class="btn-primary" onclick={openCreate}>New ambience</button>
        </div>

        {#if filteredAmbiences().length === 0}
          <p class="status">
            {searchQuery ? `No results for "${searchQuery}"` : "No ambiences yet."}
          </p>
        {:else}
          <div class="list">
            {#each filteredAmbiences() as ambience (ambience.id)}
              <div class="row">
                <span class="row-label">{ambience.label}</span>
                <div class="row-attrs">
                  {#if ambience.slug}
                    <span class="badge">/{ambience.slug}</span>
                  {/if}
                  {#if ambience.audio_asset_label}
                    <span class="badge badge--audio">
                      <AudioWaveform size={11} strokeWidth={1.5} />
                      {ambience.audio_asset_label}
                    </span>
                  {:else}
                    <span class="badge badge--warn">No audio linked</span>
                  {/if}
                  <span class="badge">{Math.round(ambience.volume * 100)}%</span>
                  <span class="badge">{ambience.loop ? "loop" : "once"}</span>
                </div>
                <div class="row-actions">
                  <button class="action-btn" onclick={() => openEdit(ambience)}>Edit</button>
                  <button class="action-btn action-btn--danger" onclick={() => openDelete(ambience)}>Delete</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {:else if activeTab === "categories"}
    <div class="tab-body">
      {#if loading}
        <p class="status">Loading…</p>
      {:else}
        <div class="toolbar toolbar--end">
          <button class="btn-primary" onclick={openCatCreate}>New category</button>
        </div>

        {#if categories.length === 0}
          <p class="status">No categories yet.</p>
        {:else}
          <div class="cat-list">
            {#each categories as cat (cat.id)}
              <div class="cat-card">
                <div class="cat-header">
                  <div class="cat-header-left">
                    <span class="cat-label">{cat.label}</span>
                    <span class="badge">order {cat.order}</span>
                  </div>
                  <div class="row-actions">
                    <button class="action-btn" onclick={() => openCatEdit(cat)}>Edit</button>
                    <button class="action-btn action-btn--danger" onclick={() => openCatDelete(cat)}>Delete</button>
                  </div>
                </div>

                <div class="cat-ambiences">
                  {#each cat.ambiences as entry (entry.id)}
                    <div class="cat-ambience-row">
                      <span class="cat-ambience-label">{entry.label}</span>
                      <button
                        class="action-btn action-btn--danger"
                        onclick={() => removeFromCategory(cat.id, entry.id)}
                      >
                        Remove
                      </button>
                    </div>
                  {/each}

                  {#if ambiencesNotInCategory(cat).length > 0}
                    <button
                      class="add-btn"
                      onclick={() => { catPickerOpenId = cat.id; catPickerOpen = true; }}
                    >
                      + Add ambience…
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<!-- ------------------------------------------------------------------------->
<!-- Dialogs                                                                  -->
<!-- ------------------------------------------------------------------------->

{#if catPickerOpenId}
  <ItemPickerDialog
    bind:open={catPickerOpen}
    items={pickerAmbiences}
    title="Add ambience to category"
    placeholder="Search ambiences…"
    onpick={handleCatPick}
    oncancel={() => (catPickerOpen = false)}
  />
{/if}

{#if formOpen}
  <AmbienceForm
    ambience={editTarget}
    bind:open={formOpen}
    {saving}
    onsave={handleSave}
    oncancel={() => { formOpen = false; editTarget = null; }}
  />
{/if}

{#if deleteTarget}
  <ConfirmDialog
    bind:open={deleteOpen}
    title="Delete ambience"
    description={`Are you sure you want to delete "${deleteTarget.label}"? This cannot be undone.`}
    confirmLabel="Delete"
    destructive
    loading={deleting}
    onconfirm={handleDelete}
    oncancel={() => { deleteOpen = false; deleteTarget = null; }}
  />
{/if}

{#if catFormOpen}
  <CategoryForm
    category={catEditTarget}
    bind:open={catFormOpen}
    {saving}
    entityLabel="category"
    withThumbnail
    onsave={handleCatSave}
    oncancel={() => { catFormOpen = false; catEditTarget = null; }}
  />
{/if}

{#if catDeleteTarget}
  <ConfirmDialog
    bind:open={catDeleteOpen}
    title="Delete category"
    description={`Are you sure you want to delete "${catDeleteTarget.label}"? Linked ambiences are not deleted.`}
    confirmLabel="Delete"
    destructive
    loading={deleting}
    onconfirm={handleCatDelete}
    oncancel={() => { catDeleteOpen = false; catDeleteTarget = null; }}
  />
{/if}

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.editor-tabs) {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .editor-header {
    display: flex;
    align-items: flex-end;
    border-bottom: 1px solid var(--color-border);
  }

  :global(.editor-tab-list) {
    display: flex;
    gap: var(--space-1);
  }

  :global(.editor-tab) {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    padding: var(--space-1) var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    cursor: pointer;
    user-select: none;
    transition: color var(--ease-fast), border-color var(--ease-fast);
  }

  :global(.editor-tab:hover) { color: var(--color-text); }
  :global(.editor-tab[data-state="active"]) {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  :global(.tab-body) {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .toolbar--end {
    justify-content: flex-end;
  }

  .status {
    color: var(--color-text-faint);
    font-size: var(--text-sm);
    font-style: italic;
  }

  /* Ambience list */
  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .row-label {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .row-attrs {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-wrap: wrap;
  }

  .badge--audio {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .badge--warn {
    color: #e67e22;
  }

  .badge {
    font-size: var(--text-xs);
    font-family: var(--font-body);
    color: var(--color-text-faint);
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    padding: 1px 6px;
  }

  .row-actions {
    display: flex;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .action-btn {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
    transition: background var(--ease-fast), color var(--ease-fast);
  }

  .action-btn:hover { background: rgba(255, 255, 255, 0.07); color: var(--color-text); }
  .action-btn--danger:hover { background: rgba(192, 57, 43, 0.15); color: #e74c3c; border-color: transparent; }

  /* Category cards */
  .cat-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .cat-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    overflow: hidden;
  }

  .cat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid var(--color-border);
  }

  .cat-header-left {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .cat-label {
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    font-weight: 500;
  }

  .cat-ambiences {
    padding: var(--space-2) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cat-ambience-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-1) 0;
  }

  .cat-ambience-label {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .add-btn {
    margin-top: var(--space-2);
    box-sizing: border-box;
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;
    transition: border-color var(--ease-fast), color var(--ease-fast);
  }

  .add-btn:hover {
    border-color: var(--color-text-faint);
    color: var(--color-text-muted);
  }

  .btn-primary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    background: var(--color-accent);
    color: #000;
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    white-space: nowrap;
    transition: opacity var(--ease-fast);
  }

  .btn-primary:hover { opacity: 0.85; }
</style>
