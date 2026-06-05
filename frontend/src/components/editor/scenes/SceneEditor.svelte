<script lang="ts">
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { toast } from "svelte-sonner";
  import { Tabs } from "bits-ui";
  import { sceneApiClient } from "@/lib/services/sceneApiClient";
  import type { Scene, SceneCategory } from "@/types/scene";
  import ConfirmDialog from "@/components/editor/shared/ConfirmDialog.svelte";
  import CategoryForm from "@/components/editor/categories/CategoryForm.svelte";
  import CategoryLinkerDialog from "@/components/editor/shared/CategoryLinkerDialog.svelte";
  import SearchInput from "@/components/editor/shared/SearchInput.svelte";
  import SceneForm from "@/components/editor/scenes/SceneForm.svelte";
  import LayerManagerDialog from "@/components/editor/scenes/LayerManagerDialog.svelte";

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let scenes = $state<Scene[]>([]);
  let categories = $state<SceneCategory[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let deleting = $state(false);

  let activeTab = $state<"scenes" | "categories">("scenes");
  let searchQuery = $state("");
  /** null = all, "" = no category, catId = specific category */
  let categoryFilter = $state<string | null>(null);
  const linkedSceneIds = $derived(
    new Set(categories.flatMap((c) => c.scenes.map((s) => s.id))),
  );

  // Scene dialogs
  let formOpen = $state(false);
  let editSceneId = $state<string | null>(null);
  let deleteTarget = $state<Scene | null>(null);
  let deleteOpen = $state(false);
  let openingEditId = $state<string | null>(null);

  // Layer manager
  let layerTarget = $state<Scene | null>(null);
  let layerManagerOpen = $state(false);

  function openLayerManager(scene: Scene) {
    layerTarget = scene;
    layerManagerOpen = true;
  }

  // Category linker
  let linkerTarget = $state<Scene | null>(null);
  let linkerOpen = $state(false);
  const linkerLinkedIds = $derived(
    linkerTarget
      ? new Set(
          categories
            .filter((c) => c.scenes.some((s) => s.id === linkerTarget!.id))
            .map((c) => c.id),
        )
      : new Set<string>(),
  );

  // Category dialogs
  let catFormOpen = $state(false);
  let catEditTarget = $state<SceneCategory | null>(null);
  let catDeleteTarget = $state<SceneCategory | null>(null);
  let catDeleteOpen = $state(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  async function load() {
    loading = true;
    try {
      [scenes, categories] = await Promise.all([
        sceneApiClient.fetchScenes(),
        sceneApiClient.fetchSceneCategories(),
      ]);
    } catch {
      toast.error("Failed to load scenes");
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

  function filteredScenes(): Scene[] {
    let result = scenes;

    if (categoryFilter === "") {
      result = result.filter((s) => !linkedSceneIds.has(s.id));
    } else if (categoryFilter !== null) {
      const catIds = new Set(
        categories.find((c) => c.id === categoryFilter)?.scenes.map((s) => s.id) ?? [],
      );
      result = result.filter((s) => catIds.has(s.id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return result;
    return result.filter((s) => s.label.toLowerCase().includes(q));
  }

  // ---------------------------------------------------------------------------
  // Scene CRUD
  // ---------------------------------------------------------------------------

  function openCreate() {
    editSceneId = null;
    formOpen = true;
  }

  async function openEdit(scene: Scene) {
    editSceneId = scene.id;
    formOpen = true;
  }

  function openDelete(scene: Scene) {
    deleteTarget = scene;
    deleteOpen = true;
  }

  /** Called by SceneForm when a scene is created or updated. */
  function handleSave(data: { id: string; label: string; slug: string }) {
    const existing = scenes.find((s) => s.id === data.id);
    if (existing) {
      scenes = scenes.map((s) => (s.id === data.id ? { ...s, label: data.label, slug: data.slug || null } : s));
    } else {
      // New scene — add to list; SceneForm stays open in edit mode
      const placeholder: Scene = {
        id: data.id,
        slug: data.slug || null,
        label: data.label,
        background: { id: data.id, src: "", type: "image", loop: true, opacity: 1, brightness: 1, grayscale: 0, blur: 0, flip: false, blend_mode: "normal", thumb_src: null },
        layers: [],
      };
      scenes = [...scenes, placeholder].sort((a, b) => a.label.localeCompare(b.label));
      // Switch form to edit mode
      editSceneId = data.id;
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await sceneApiClient.deleteScene(deleteTarget.id);
      scenes = scenes.filter((s) => s.id !== deleteTarget!.id);
      categories = categories.map((c) => ({
        ...c,
        scenes: c.scenes.filter((e) => e.id !== deleteTarget!.id),
      }));
      toast.success("Scene deleted");
      deleteOpen = false;
      deleteTarget = null;
    } catch {
      toast.error("Failed to delete scene");
    } finally {
      deleting = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Category linker
  // ---------------------------------------------------------------------------

  function openLinker(scene: Scene) {
    linkerTarget = scene;
    linkerOpen = true;
  }

  async function handleLink(categoryId: string) {
    if (!linkerTarget) return;
    const sceneId = linkerTarget.id;
    try {
      await sceneApiClient.addSceneToCategory(categoryId, sceneId);
      categories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, scenes: [...c.scenes, { id: sceneId, label: linkerTarget!.label }] }
          : c,
      );
      const catLabel = categories.find((c) => c.id === categoryId)?.label;
      toast.success(`Added to ${catLabel}`);
    } catch {
      toast.error("Failed to link category");
    }
  }

  async function handleUnlink(categoryId: string) {
    if (!linkerTarget) return;
    const sceneId = linkerTarget.id;
    try {
      await sceneApiClient.removeSceneFromCategory(categoryId, sceneId);
      const catLabel = categories.find((c) => c.id === categoryId)?.label;
      categories = categories.map((c) =>
        c.id === categoryId
          ? { ...c, scenes: c.scenes.filter((s) => s.id !== sceneId) }
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

  function openCatEdit(cat: SceneCategory) {
    catEditTarget = cat;
    catFormOpen = true;
  }

  function openCatDelete(cat: SceneCategory) {
    catDeleteTarget = cat;
    catDeleteOpen = true;
  }

  async function handleCatSave(data: { label: string; display_order: number; thumb_id: string | null }) {
    saving = true;
    try {
      const patch = { label: data.label, display_order: data.display_order };

      if (catEditTarget) {
        const updated = await sceneApiClient.patchCategory(catEditTarget.id, patch);
        categories = categories.map((c) => (c.id === updated.id ? updated : c));
        toast.success("Category updated");
      } else {
        const created = await sceneApiClient.createCategory(patch);
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

  async function handleCatDelete() {
    if (!catDeleteTarget) return;
    deleting = true;
    try {
      await sceneApiClient.deleteCategory(catDeleteTarget.id);
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

  function handleCatConsider(e: CustomEvent<DndEvent<SceneCategory>>) {
    categories = e.detail.items;
  }

  async function handleCatFinalize(e: CustomEvent<DndEvent<SceneCategory>>) {
    categories = e.detail.items;
    try {
      await Promise.all(
        categories.map((cat, i) => sceneApiClient.patchCategory(cat.id, { display_order: i })),
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
        <Tabs.Trigger value="scenes" class="editor-tab">Scenes</Tabs.Trigger>
        <Tabs.Trigger value="categories" class="editor-tab">Categories</Tabs.Trigger>
      </Tabs.List>
    </div>
  </Tabs.Root>

  {#if activeTab === "scenes"}
    <div class="tab-body">
      {#if loading}
        <p class="status">Loading…</p>
      {:else}
        <div class="toolbar">
          <SearchInput bind:value={searchQuery} placeholder="Search scenes…" />
          <button class="btn-primary" onclick={openCreate}>New scene</button>
        </div>

        <div class="filter-bar">
          <button class="filter-chip" class:filter-chip--active={categoryFilter === null} onclick={() => (categoryFilter = null)}>All</button>
          <button class="filter-chip" class:filter-chip--active={categoryFilter === ""} onclick={() => (categoryFilter = "")}>None</button>
          {#each categories as cat (cat.id)}
            <button class="filter-chip" class:filter-chip--active={categoryFilter === cat.id} onclick={() => (categoryFilter = cat.id)}>{cat.label}</button>
          {/each}
        </div>

        {#if filteredScenes().length === 0}
          <p class="status">{searchQuery ? `No results for "${searchQuery}"` : "No scenes yet."}</p>
        {:else}
          <div class="list">
            {#each filteredScenes() as scene (scene.id)}
              <div class="row">
                <span class="row-label">{scene.label}</span>
                <div class="row-actions">
                  <button class="action-btn" onclick={() => openLinker(scene)}>Categories</button>
                  <button class="action-btn" onclick={() => openLayerManager(scene)}>Layers</button>
                  <button class="action-btn" disabled={openingEditId === scene.id} onclick={() => openEdit(scene)}>
                    {openingEditId === scene.id ? "Loading…" : "Edit"}
                  </button>
                  <button class="action-btn action-btn--danger" onclick={() => openDelete(scene)}>Delete</button>
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
                  <button class="action-btn action-btn--danger" onclick={() => openCatDelete(cat)}>Delete</button>
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
  <SceneForm
    sceneId={editSceneId}
    bind:open={formOpen}
    onsave={handleSave}
    oncancel={() => {
      formOpen = false;
      editSceneId = null;
    }}
  />
{/if}

{#if deleteTarget}
  <ConfirmDialog
    bind:open={deleteOpen}
    title="Delete scene"
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

{#if layerTarget}
  <LayerManagerDialog
    bind:open={layerManagerOpen}
    sceneId={layerTarget.id}
    sceneLabel={layerTarget.label}
    onclose={() => {
      layerManagerOpen = false;
      layerTarget = null;
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
    description={`Are you sure you want to delete "${catDeleteTarget.label}"? Linked scenes are not deleted.`}
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
  .editor { display: flex; flex-direction: column; gap: var(--space-4); }

  :global(.editor-tabs) { display: flex; flex-direction: column; gap: var(--space-4); }

  .editor-header {
    display: flex;
    align-items: flex-end;
    border-bottom: 1px solid var(--color-border);
  }

  :global(.editor-tab-list) { display: flex; gap: var(--space-1); }

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
  :global(.editor-tab[data-state="active"]) { color: var(--color-text); border-bottom-color: var(--color-accent); }
  :global(.tab-body) { display: flex; flex-direction: column; gap: var(--space-4); }

  .toolbar { display: flex; align-items: center; gap: var(--space-2); }
  .toolbar--end { justify-content: flex-end; }

  .filter-bar { display: flex; flex-wrap: wrap; gap: var(--space-1); }

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

  .filter-chip:hover { color: var(--color-text-muted); border-color: var(--color-text-faint); }
  .filter-chip--active { color: var(--color-accent); border-color: var(--color-accent); background: rgba(255, 255, 255, 0.06); }

  .status { color: var(--color-text-faint); font-size: var(--text-sm); font-style: italic; }

  .list { display: flex; flex-direction: column; gap: 2px; }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .drag-handle { color: var(--color-text-faint); font-size: var(--text-sm); cursor: grab; flex-shrink: 0; user-select: none; }
  .drag-handle:active { cursor: grabbing; }

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

  .row-actions { display: flex; gap: var(--space-1); flex-shrink: 0; }

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
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
