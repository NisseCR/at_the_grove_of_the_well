<script lang="ts">
  import { Tabs } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
  import type { Ambience, AmbienceCategory } from "@/types/ambience";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import ConfirmDialog from "@/components/editor/shared/ConfirmDialog.svelte";
  import CategoryLinkerDialog from "@/components/editor/shared/CategoryLinkerDialog.svelte";
  import AmbienceForm from "@/components/editor/ambiences/AmbienceForm.svelte";
  import CategoryForm from "@/components/editor/categories/CategoryForm.svelte";
  import SearchInput from "@/components/editor/shared/SearchInput.svelte";

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
  /** null = all, "" = no category, catId = specific category */
  let categoryFilter = $state<string | null>(null);
  /** IDs of all ambiences that are linked to at least one category. */
  const linkedAmbienceIds = $derived(
    new Set(categories.flatMap((c) => c.ambiences.map((a) => a.id))),
  );

  // Ambience dialogs
  let formOpen = $state(false);
  let editTarget = $state<Ambience | null>(null);
  let deleteTarget = $state<Ambience | null>(null);
  let deleteOpen = $state(false);

  // Category linker dialog
  let linkerTarget = $state<Ambience | null>(null);
  let linkerOpen = $state(false);
  /** IDs of categories currently linked to the linker target, derived live. */
  const linkerLinkedIds = $derived(
    linkerTarget
      ? new Set(
          categories
            .filter((c) => c.ambiences.some((a) => a.id === linkerTarget!.id))
            .map((c) => c.id),
        )
      : new Set<string>(),
  );

  /** Opens the category linker for the given ambience. */
  function openLinker(ambience: Ambience) {
    linkerTarget = ambience;
    linkerOpen = true;
  }

  /** Adds a category link and updates local state. */
  async function handleLink(categoryId: string) {
    if (!linkerTarget) return;
    const ambienceId = linkerTarget.id;
    try {
      await ambienceApiClient.addAmbienceToCategory(categoryId, ambienceId);
      categories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, ambiences: [...c.ambiences, { id: ambienceId, label: linkerTarget!.label }] }
          : c,
      );
      const catLabel = categories.find((c) => c.id === categoryId)?.label;
      toast.success(`Added to ${catLabel}`);
    } catch {
      toast.error("Failed to link category");
    }
  }

  /** Removes a category link and updates local state. */
  async function handleUnlink(categoryId: string) {
    if (!linkerTarget) return;
    const ambienceId = linkerTarget.id;
    try {
      await ambienceApiClient.removeAmbienceFromCategory(categoryId, ambienceId);
      const catLabel = categories.find((c) => c.id === categoryId)?.label;
      categories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, ambiences: c.ambiences.filter((a) => a.id !== ambienceId) }
          : c,
      );
      toast.success(`Removed from ${catLabel}`);
    } catch {
      toast.error("Failed to unlink category");
    }
  }

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

  $effect(() => {
    load();
  });

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  /** Returns ambiences filtered by the active category filter and search query. */
  function filteredAmbiences(): Ambience[] {
    let result = ambiences;

    if (categoryFilter === "") {
      result = result.filter((a) => !linkedAmbienceIds.has(a.id));
    } else if (categoryFilter !== null) {
      const catIds = new Set(
        categories
          .find((c) => c.id === categoryFilter)
          ?.ambiences.map((a) => a.id) ?? [],
      );
      result = result.filter((a) => catIds.has(a.id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
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
        const updated = await ambienceApiClient.patchAmbience(
          editTarget.id,
          payload,
        );
        ambiences = ambiences.map((a) => (a.id === updated.id ? updated : a));
        toast.success("Ambience updated");
      } else {
        const created = await ambienceApiClient.createAmbience(payload);
        ambiences = [...ambiences, created].sort((a, b) =>
          a.label.localeCompare(b.label),
        );
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
        ...(data.thumb_id !== null
          ? { thumb_id: data.thumb_id || undefined }
          : {}),
      };

      if (catEditTarget) {
        const updated = await ambienceApiClient.patchCategory(
          catEditTarget.id,
          patch,
        );
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

  /** Updates category order after a drag-and-drop finalize event. */
  function handleCatConsider(e: CustomEvent<DndEvent<AmbienceCategory>>) {
    categories = e.detail.items;
  }

  /** Persists the new category order to the backend. */
  async function handleCatFinalize(e: CustomEvent<DndEvent<AmbienceCategory>>) {
    categories = e.detail.items;
    try {
      await Promise.all(
        categories.map((cat, i) =>
          ambienceApiClient.patchCategory(cat.id, { display_order: i }),
        ),
      );
      toast.success("Category order saved");
    } catch {
      toast.error("Failed to save category order");
    }
  }
</script>

<div class="editor">
  <Tabs.Root bind:value={activeTab} class="editor-tabs">
    <div class="editor-header">
      <Tabs.List class="editor-tab-list">
        <Tabs.Trigger value="ambiences" class="editor-tab"
          >Ambiences</Tabs.Trigger
        >
        <Tabs.Trigger value="categories" class="editor-tab"
          >Categories</Tabs.Trigger
        >
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
          <SearchInput
            bind:value={searchQuery}
            placeholder="Search by label or audio asset…"
          />
          <button class="btn-primary" onclick={openCreate}>New ambience</button>
        </div>

        <div class="filter-bar">
          <button
            class="filter-chip"
            class:filter-chip--active={categoryFilter === null}
            onclick={() => (categoryFilter = null)}>All</button
          >
          <button
            class="filter-chip"
            class:filter-chip--active={categoryFilter === ""}
            onclick={() => (categoryFilter = "")}>None</button
          >
          {#each categories as cat (cat.id)}
            <button
              class="filter-chip"
              class:filter-chip--active={categoryFilter === cat.id}
              onclick={() => (categoryFilter = cat.id)}>{cat.label}</button
            >
          {/each}
        </div>

        {#if filteredAmbiences().length === 0}
          <p class="status">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "No ambiences yet."}
          </p>
        {:else}
          <div class="list">
            {#each filteredAmbiences() as ambience (ambience.id)}
              <div class="row">
                <span class="row-label">{ambience.label}</span>
                <div class="row-actions">
                  <button class="action-btn" onclick={() => openLinker(ambience)}>Categories</button>
                  <button class="action-btn" onclick={() => openEdit(ambience)}>Edit</button>
                  <button
                    class="action-btn action-btn--danger"
                    onclick={() => openDelete(ambience)}>Delete</button
                  >
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
          <button class="btn-primary" onclick={openCatCreate}
            >New category</button
          >
        </div>

        {#if categories.length === 0}
          <p class="status">No categories yet.</p>
        {:else}
          <div
            class="list"
            use:dndzone={{ items: categories, flipDurationMs: 150 }}
            onconsider={handleCatConsider}
            onfinalize={handleCatFinalize}
          >
            {#each categories as cat (cat.id)}
              <div class="row" animate:flip={{ duration: 150 }}>
                <span class="drag-handle" aria-hidden="true">⠿</span>
                <span class="row-label">{cat.label}</span>
                <div class="row-actions">
                  <button class="action-btn" onclick={() => openCatEdit(cat)}
                    >Edit</button
                  >
                  <button
                    class="action-btn action-btn--danger"
                    onclick={() => openCatDelete(cat)}>Delete</button
                  >
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

{#if formOpen}
  <AmbienceForm
    ambience={editTarget}
    bind:open={formOpen}
    {saving}
    onsave={handleSave}
    oncancel={() => {
      formOpen = false;
      editTarget = null;
    }}
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
    oncancel={() => {
      deleteOpen = false;
      deleteTarget = null;
    }}
  />
{/if}

{#if linkerTarget}
  <CategoryLinkerDialog
    bind:open={linkerOpen}
    entityLabel={linkerTarget.label}
    {categories}
    linkedIds={linkerLinkedIds}
    onlink={handleLink}
    onunlink={handleUnlink}
    onclose={() => {
      linkerOpen = false;
      linkerTarget = null;
    }}
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
    oncancel={() => {
      catFormOpen = false;
      catEditTarget = null;
    }}
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
    oncancel={() => {
      catDeleteOpen = false;
      catDeleteTarget = null;
    }}
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
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast);
  }

  :global(.editor-tab:hover) {
    color: var(--color-text);
  }
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

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .filter-chip {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: 99px;
    padding: 2px var(--space-3);
    cursor: pointer;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast),
      background var(--ease-fast);
    white-space: nowrap;
  }

  .filter-chip:hover {
    color: var(--color-text-muted);
    border-color: var(--color-text-faint);
  }

  .filter-chip--active {
    color: var(--color-accent);
    border-color: var(--color-accent);
    background: rgba(255, 255, 255, 0.06);
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

  .drag-handle {
    color: var(--color-text-faint);
    font-size: var(--text-sm);
    cursor: grab;
    flex-shrink: 0;
    user-select: none;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .row-label {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    transition:
      background var(--ease-fast),
      color var(--ease-fast);
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.07);
    color: var(--color-text);
  }
  .action-btn--danger:hover {
    background: rgba(192, 57, 43, 0.15);
    color: #e74c3c;
    border-color: transparent;
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

  .btn-primary:hover {
    opacity: 0.85;
  }
</style>
