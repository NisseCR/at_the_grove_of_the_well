<script lang="ts">
  import { Dialog } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { sceneApiClient } from "@/lib/services/sceneApiClient";
  import type { LayerEditor, LayerProperties } from "@/types/scene";
  import type { AnyAsset, AssetType } from "@/types/assets";
  import AssetPickerDialog from "@/components/editor/shared/AssetPickerDialog.svelte";
  import LayerPropertiesDialog from "@/components/editor/scenes/LayerPropertiesDialog.svelte";

  interface Props {
    open: boolean;
    sceneId: string;
    sceneLabel: string;
    onclose: () => void;
  }

  let { open = $bindable(), sceneId, sceneLabel, onclose }: Props = $props();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let loading = $state(false);
  type DndLayer = LayerEditor & { id: string };

  let layers = $state<DndLayer[]>([]);

  let pickerOpen = $state(false);
  let propsTarget = $state<LayerEditor | null>(null);
  let propsOpen = $state(false);

  $effect(() => {
    if (open && sceneId) loadLayers();
  });

  async function loadLayers() {
    loading = true;
    try {
      const scene = await sceneApiClient.fetchSceneEditor(sceneId);
      layers = scene.layers.map((l) => ({ ...l, id: l.layer_id }));
    } catch {
      toast.error("Failed to load layers");
    } finally {
      loading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Layer management
  // ---------------------------------------------------------------------------

  async function handlePick(asset: AnyAsset, type: AssetType) {
    try {
      const payload = type === "image" ? { image_asset_id: asset.id } : { video_asset_id: asset.id };
      const layer = await sceneApiClient.addLayer(sceneId, payload);
      layers = [...layers, { ...layer, id: layer.layer_id }];
      toast.success("Layer added");
    } catch {
      toast.error("Failed to add layer");
    }
    pickerOpen = false;
  }

  function openProps(layer: LayerEditor) {
    propsTarget = layer;
    propsOpen = true;
  }

  async function handlePropsSave(props: LayerProperties) {
    if (!propsTarget) return;
    try {
      const updated = await sceneApiClient.patchLayer(sceneId, propsTarget.layer_id, props);
      layers = layers.map((l) => (l.layer_id === updated.layer_id ? { ...updated, id: updated.layer_id } : l));
      toast.success("Layer properties saved");
    } catch {
      toast.error("Failed to save layer properties");
    }
    propsOpen = false;
    propsTarget = null;
  }

  async function handleDelete(layer: LayerEditor) {
    try {
      await sceneApiClient.deleteLayer(sceneId, layer.layer_id);
      layers = layers.filter((l) => l.layer_id !== layer.layer_id);
      toast.success("Layer removed");
    } catch {
      toast.error("Failed to remove layer");
    }
  }

  function handleConsider(e: CustomEvent<DndEvent<DndLayer>>) {
    layers = e.detail.items;
  }

  async function handleFinalize(e: CustomEvent<DndEvent<DndLayer>>) {
    layers = e.detail.items;
    try {
      await sceneApiClient.reorderLayers(sceneId, layers.map((l) => l.layer_id));
      toast.success("Layer order saved");
    } catch {
      toast.error("Failed to save layer order");
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) onclose(); }}>
  <Dialog.Portal>
    <Dialog.Overlay class="lm-overlay" />
    <Dialog.Content class="lm-panel">
      <Dialog.Title class="lm-title">Layers — {sceneLabel}</Dialog.Title>

      {#if loading}
        <p class="lm-status">Loading…</p>
      {:else if layers.length === 0}
        <p class="lm-status">No layers yet.</p>
      {:else}
        <div
          class="layer-list"
          use:dndzone={{ items: layers, flipDurationMs: 150 }}
          onconsider={handleConsider}
          onfinalize={handleFinalize}
        >
          {#each layers as layer (layer.layer_id)}
            <div class="layer-row" animate:flip={{ duration: 150 }}>
              <span class="drag-handle" aria-hidden="true">⠿</span>
              {#if layer.type === "video"}
                <span class="type-badge">video</span>
              {/if}
              <span class="layer-label">{layer.label}</span>
              <div class="row-actions">
                <button class="action-btn" onclick={() => openProps(layer)}>Properties</button>
                <button class="action-btn action-btn--danger" onclick={() => handleDelete(layer)}>Remove</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <button class="btn-pick" onclick={() => (pickerOpen = true)}>Add layer…</button>

      <div class="lm-actions">
        <button class="btn-secondary" onclick={onclose}>Close</button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

{#if pickerOpen}
  <AssetPickerDialog
    bind:open={pickerOpen}
    types={["image", "video"]}
    title="Add layer"
    onpick={handlePick}
    oncancel={() => (pickerOpen = false)}
  />
{/if}

{#if propsTarget}
  <LayerPropertiesDialog
    bind:open={propsOpen}
    title={`${propsTarget.label} — properties`}
    properties={propsTarget}
    assetType={propsTarget.type}
    onsave={handlePropsSave}
    oncancel={() => { propsOpen = false; propsTarget = null; }}
  />
{/if}

<style>
  :global(.lm-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.lm-panel) {
    position: fixed;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(520px, 92vw);
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.lm-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  :global(.lm-status) {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    font-style: italic;
    margin: 0;
  }

  .layer-list { display: flex; flex-direction: column; gap: 2px; }

  .layer-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .drag-handle { color: var(--color-text-faint); font-size: var(--text-sm); cursor: grab; flex-shrink: 0; user-select: none; }
  .drag-handle:active { cursor: grabbing; }

  .type-badge {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px var(--space-2);
    flex-shrink: 0;
  }

  .layer-label {
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

  .btn-pick {
    padding: var(--space-2) var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    cursor: pointer;
    text-align: left;
    transition: border-color var(--ease-fast), color var(--ease-fast);
  }

  .btn-pick:hover { border-color: var(--color-text-faint); color: var(--color-text-muted); }

  .lm-actions { display: flex; justify-content: flex-end; border-top: 1px solid var(--color-border); padding-top: var(--space-4); }

  .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: background var(--ease-fast), color var(--ease-fast);
  }

  .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); color: var(--color-text); }
</style>
