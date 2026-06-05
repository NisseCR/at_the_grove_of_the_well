<script lang="ts">
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { toast } from "svelte-sonner";
  import { Tabs } from "bits-ui";
  import { playlistApiClient } from "@/lib/services/playlistApiClient";
  import type { PlaylistCategory, PlaylistEditor } from "@/types/music";
  import ConfirmDialog from "@/components/editor/shared/ConfirmDialog.svelte";
  import CategoryForm from "@/components/editor/categories/CategoryForm.svelte";
  import CategoryLinkerDialog from "@/components/editor/shared/CategoryLinkerDialog.svelte";
  import SearchInput from "@/components/editor/shared/SearchInput.svelte";
  import PlaylistForm from "@/components/editor/playlists/PlaylistForm.svelte";

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let playlists = $state<PlaylistEditor[]>([]);
  let categories = $state<PlaylistCategory[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let deleting = $state(false);

  let activeTab = $state<"playlists" | "categories">("playlists");
  let searchQuery = $state("");
  /** null = all, "" = no category, catId = specific category */
  let categoryFilter = $state<string | null>(null);
  /** IDs of all playlists linked to at least one category. */
  const linkedPlaylistIds = $derived(
    new Set(categories.flatMap((c) => c.playlists.map((p) => p.id))),
  );

  // Playlist dialogs
  let formOpen = $state(false);
  let editTarget = $state<PlaylistEditor | null>(null);
  let deleteTarget = $state<PlaylistEditor | null>(null);
  let deleteOpen = $state(false);

  // Category linker dialog
  let linkerTarget = $state<PlaylistEditor | null>(null);
  let linkerOpen = $state(false);
  const linkerLinkedIds = $derived(
    linkerTarget
      ? new Set(
          categories
            .filter((c) => c.playlists.some((p) => p.id === linkerTarget!.id))
            .map((c) => c.id),
        )
      : new Set<string>(),
  );

  // Category dialogs
  let catFormOpen = $state(false);
  let catEditTarget = $state<PlaylistCategory | null>(null);
  let catDeleteTarget = $state<PlaylistCategory | null>(null);
  let catDeleteOpen = $state(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  /** Load both playlists and categories on mount. */
  async function load() {
    loading = true;
    try {
      [playlists, categories] = await Promise.all([
        playlistApiClient.fetchPlaylists(),
        playlistApiClient.fetchCategories(),
      ]);
    } catch {
      toast.error("Failed to load playlists");
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

  /** Returns playlists filtered by the active category filter and search query. */
  function filteredPlaylists(): PlaylistEditor[] {
    let result = playlists;

    if (categoryFilter === "") {
      result = result.filter((p) => !linkedPlaylistIds.has(p.id));
    } else if (categoryFilter !== null) {
      const catIds = new Set(
        categories.find((c) => c.id === categoryFilter)?.playlists.map((p) => p.id) ?? [],
      );
      result = result.filter((p) => catIds.has(p.id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;
    return result.filter((p) => p.label.toLowerCase().includes(q));
  }

  // ---------------------------------------------------------------------------
  // Playlist CRUD
  // ---------------------------------------------------------------------------

  /** Opens the create form. */
  function openCreate() {
    editTarget = null;
    formOpen = true;
  }

  /** Opens the edit form pre-filled with the given playlist. */
  function openEdit(playlist: PlaylistEditor) {
    editTarget = playlist;
    formOpen = true;
  }

  /** Opens the delete confirmation for the given playlist. */
  function openDelete(playlist: PlaylistEditor) {
    deleteTarget = playlist;
    deleteOpen = true;
  }

  /** Creates or updates a playlist. After create, auto-switches to edit mode for track management. */
  async function handleSave(data: {
    label: string;
    slug: string;
    volume: number;
    cover_id: string | null;
    tracks: PlaylistEditor["tracks"];
  }) {
    saving = true;
    try {
      const payload = {
        label: data.label,
        slug: data.slug || undefined,
        volume: data.volume,
        cover_id: data.cover_id ?? undefined,
      };

      if (editTarget) {
        const updated = await playlistApiClient.patchPlaylist(editTarget.id, payload);
        playlists = playlists.map((p) =>
          p.id === updated.id ? { ...updated, tracks: data.tracks } : p,
        );
        toast.success("Playlist updated");
        formOpen = false;
        editTarget = null;
      } else {
        const created = await playlistApiClient.createPlaylist(payload);
        const withTracks = { ...created, tracks: [] };
        playlists = [...playlists, withTracks].sort((a, b) => a.label.localeCompare(b.label));
        // Auto-switch to edit mode so tracks can be added immediately
        editTarget = withTracks;
        toast.success("Playlist created — add tracks below");
      }
    } catch {
      toast.error("Failed to save playlist");
    } finally {
      saving = false;
    }
  }

  /** Deletes the targeted playlist. */
  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await playlistApiClient.deletePlaylist(deleteTarget.id);
      playlists = playlists.filter((p) => p.id !== deleteTarget!.id);
      categories = categories.map((c) => ({
        ...c,
        playlists: c.playlists.filter((e) => e.id !== deleteTarget!.id),
      }));
      toast.success("Playlist deleted");
      deleteOpen = false;
      deleteTarget = null;
    } catch {
      toast.error("Failed to delete playlist");
    } finally {
      deleting = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Category linker
  // ---------------------------------------------------------------------------

  /** Opens the category linker for the given playlist. */
  function openLinker(playlist: PlaylistEditor) {
    linkerTarget = playlist;
    linkerOpen = true;
  }

  /** Adds a category link and updates local state. */
  async function handleLink(categoryId: string) {
    if (!linkerTarget) return;
    const playlistId = linkerTarget.id;
    try {
      await playlistApiClient.addPlaylistToCategory(categoryId, playlistId);
      categories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, playlists: [...c.playlists, { id: playlistId, label: linkerTarget!.label }] }
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
    const playlistId = linkerTarget.id;
    try {
      await playlistApiClient.removePlaylistFromCategory(categoryId, playlistId);
      const catLabel = categories.find((c) => c.id === categoryId)?.label;
      categories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, playlists: c.playlists.filter((p) => p.id !== playlistId) }
          : c,
      );
      toast.success(`Removed from ${catLabel}`);
    } catch {
      toast.error("Failed to unlink category");
    }
  }

  // ---------------------------------------------------------------------------
  // Category CRUD
  // ---------------------------------------------------------------------------

  function openCatCreate() {
    catEditTarget = null;
    catFormOpen = true;
  }

  function openCatEdit(cat: PlaylistCategory) {
    catEditTarget = cat;
    catFormOpen = true;
  }

  function openCatDelete(cat: PlaylistCategory) {
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
      const patch = { label: data.label, display_order: data.display_order };

      if (catEditTarget) {
        const updated = await playlistApiClient.patchCategory(catEditTarget.id, patch);
        categories = categories.map((c) => (c.id === updated.id ? updated : c));
        toast.success("Category updated");
      } else {
        const created = await playlistApiClient.createCategory(patch);
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
      await playlistApiClient.deleteCategory(catDeleteTarget.id);
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

  /** Updates category order while dragging. */
  function handleCatConsider(e: CustomEvent<DndEvent<PlaylistCategory>>) {
    categories = e.detail.items;
  }

  /** Persists the new category order to the backend. */
  async function handleCatFinalize(e: CustomEvent<DndEvent<PlaylistCategory>>) {
    categories = e.detail.items;
    try {
      await Promise.all(
        categories.map((cat, i) => playlistApiClient.patchCategory(cat.id, { display_order: i })),
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
        <Tabs.Trigger value="playlists" class="editor-tab">Playlists</Tabs.Trigger>
        <Tabs.Trigger value="categories" class="editor-tab">Categories</Tabs.Trigger>
      </Tabs.List>
    </div>
  </Tabs.Root>

  {#if activeTab === "playlists"}
    <div class="tab-body">
      {#if loading}
        <p class="status">Loading…</p>
      {:else}
        <div class="toolbar">
          <SearchInput bind:value={searchQuery} placeholder="Search playlists…" />
          <button class="btn-primary" onclick={openCreate}>New playlist</button>
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

        {#if filteredPlaylists().length === 0}
          <p class="status">
            {searchQuery ? `No results for "${searchQuery}"` : "No playlists yet."}
          </p>
        {:else}
          <div class="list">
            {#each filteredPlaylists() as playlist (playlist.id)}
              <div class="row">
                <span class="row-label">{playlist.label}</span>
                <div class="row-actions">
                  <button class="action-btn" onclick={() => openLinker(playlist)}>Categories</button>
                  <button class="action-btn" onclick={() => openEdit(playlist)}>Edit</button>
                  <button
                    class="action-btn action-btn--danger"
                    onclick={() => openDelete(playlist)}>Delete</button
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
          <button class="btn-primary" onclick={openCatCreate}>New category</button>
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
                  <button class="action-btn" onclick={() => openCatEdit(cat)}>Edit</button>
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

<!-- Dialogs -->

{#if formOpen}
  <PlaylistForm
    playlist={editTarget}
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
    title="Delete playlist"
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
    description={`Are you sure you want to delete "${catDeleteTarget.label}"? Linked playlists are not deleted.`}
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
    transition: color var(--ease-fast), border-color var(--ease-fast);
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
    transition: color var(--ease-fast), border-color var(--ease-fast), background var(--ease-fast);
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
    transition: background var(--ease-fast), color var(--ease-fast);
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
