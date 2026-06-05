<script lang="ts">
  import { Dialog, Label } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { assetUrl } from "@/lib/config";
  import { sceneApiClient } from "@/lib/services/sceneApiClient";
  import type { BackgroundEditor, LayerProperties, SceneEditor } from "@/types/scene";
  import type { AssetType } from "@/types/assets";
  import AssetPickerDialog from "@/components/editor/shared/AssetPickerDialog.svelte";
  import LayerPropertiesDialog from "@/components/editor/scenes/LayerPropertiesDialog.svelte";

  interface Props {
    /** Null when creating a new scene. */
    sceneId?: string | null;
    open: boolean;
    onsave: (data: { id: string; label: string; slug: string }) => void;
    oncancel: () => void;
  }

  let { sceneId = null, open = $bindable(), onsave, oncancel }: Props = $props();

  const isNew = $derived(!sceneId);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  let loading = $state(false);
  let saving = $state(false);
  let scene = $state<SceneEditor | null>(null);

  $effect(() => {
    if (open) {
      if (sceneId) {
        loadScene(sceneId);
      } else {
        scene = null;
        label = "";
        slug = "";
        background = emptyBackground();
      }
    }
  });

  function emptyBackground(): BackgroundEditor {
    return { asset_id: null, label: null, type: null, thumb_src: null, loop: true, opacity: 1, brightness: 1, grayscale: 0, blur: 0, flip: false, blend_mode: "normal" };
  }

  async function loadScene(id: string) {
    loading = true;
    try {
      scene = await sceneApiClient.fetchSceneEditor(id);
      label = scene.label;
      slug = scene.slug ?? "";
      background = { ...scene.background };
    } catch {
      toast.error("Failed to load scene");
    } finally {
      loading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Form state
  // ---------------------------------------------------------------------------

  let label = $state("");
  let slug = $state("");
  let background = $state<BackgroundEditor>(emptyBackground());

  let bgPickerOpen = $state(false);
  let bgPropsOpen = $state(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    saving = true;
    try {
      if (isNew) {
        const created = await sceneApiClient.createScene({ label: label.trim(), slug: slug.trim() || undefined });
        scene = created;
        background = { ...created.background };
        onsave({ id: created.id, label: created.label, slug: created.slug ?? "" });
        // Stay open in edit mode
      } else {
        const updated = await sceneApiClient.patchScene(sceneId!, {
          label: label.trim(),
          slug: slug.trim() || undefined,
        });
        onsave({ id: updated.id, label: updated.label, slug: updated.slug ?? "" });
        open = false;
      }
    } catch {
      toast.error("Failed to save scene");
    } finally {
      saving = false;
    }
  }

  async function handleBgPick(asset: { id: string }, type: AssetType) {
    if (!scene) return;
    try {
      const patch = type === "image" ? { image_asset_id: asset.id } : { video_asset_id: asset.id };
      const updated = await sceneApiClient.patchBackground(scene.id, patch);
      background = updated;
      toast.success("Background updated");
    } catch {
      toast.error("Failed to update background");
    }
    bgPickerOpen = false;
  }

  async function handleBgPropsSave(props: LayerProperties) {
    if (!scene) return;
    try {
      const updated = await sceneApiClient.patchBackground(scene.id, props);
      background = updated;
      toast.success("Background properties saved");
    } catch {
      toast.error("Failed to save background properties");
    }
    bgPropsOpen = false;
  }

  function fmtPct(v: number) {
    return `${Math.round(v * 100)}%`;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="sf-overlay" />
    <Dialog.Content class="sf-panel">
      <Dialog.Title class="sf-title">
        {isNew ? "New scene" : `Edit — ${scene?.label ?? label}`}
      </Dialog.Title>

      {#if loading}
        <p class="status">Loading…</p>
      {:else}
        <form onsubmit={handleSubmit} class="form">
          <div class="field">
            <Label.Root for="sf-label" class="field-label">Label</Label.Root>
            <input id="sf-label" class="input" type="text" bind:value={label} required disabled={saving} placeholder="e.g. Moonlit forest" />
          </div>

          <div class="field">
            <Label.Root for="sf-slug" class="field-label">
              Slug <span class="optional">(optional — used in story tags)</span>
            </Label.Root>
            <input id="sf-slug" class="input" type="text" bind:value={slug} disabled={saving} placeholder="e.g. moonlit-forest" />
          </div>

          {#if !isNew}
            <div class="section">
              <p class="section-label">Background</p>
              <div class="asset-row">
                {#if background.thumb_url}
                  <img src={background.thumb_url} alt="background" class="thumb" />
                {:else if background.type === "video"}
                  <span class="type-badge">video</span>
                {/if}

                {#if background.label}
                  <span class="asset-label">{background.label}</span>
                {:else}
                  <span class="asset-label asset-label--empty">No asset selected</span>
                {/if}

                <button type="button" class="btn-ghost" onclick={() => (bgPickerOpen = true)}>
                  {background.asset_id ? "Change" : "Pick asset…"}
                </button>
                {#if background.asset_id}
                  <button type="button" class="btn-ghost" onclick={() => (bgPropsOpen = true)}>
                    Properties
                  </button>
                {/if}
              </div>
            </div>
          {:else}
            <p class="create-note">Background and layers can be configured after creating the scene.</p>
          {/if}

          <div class="actions">
            <button type="button" class="btn-secondary" onclick={oncancel} disabled={saving}>Cancel</button>
            <button type="submit" class="btn-primary" disabled={saving || !label.trim()}>
              {saving ? "Saving…" : isNew ? "Create" : "Save"}
            </button>
          </div>
        </form>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

{#if bgPickerOpen}
  <AssetPickerDialog
    bind:open={bgPickerOpen}
    types={["image", "video"]}
    title="Pick background asset"
    onpick={(asset, type) => handleBgPick(asset, type)}
    oncancel={() => (bgPickerOpen = false)}
  />
{/if}

{#if bgPropsOpen}
  <LayerPropertiesDialog
    bind:open={bgPropsOpen}
    title="Background properties"
    properties={background}
    assetType={background.type}
    onsave={handleBgPropsSave}
    oncancel={() => (bgPropsOpen = false)}
  />
{/if}

<style>
  :global(.sf-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.sf-panel) {
    position: fixed;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(500px, 92vw);
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.sf-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  .status, .create-note {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    font-style: italic;
    margin: 0;
  }

  .form { display: flex; flex-direction: column; gap: var(--space-4); }

  .field { display: flex; flex-direction: column; gap: var(--space-1); }

  :global(.field-label) {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-family: var(--font-body);
  }

  .optional { color: var(--color-text-faint); font-size: var(--text-xs); }

  .input {
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .input:focus { border-color: var(--color-accent); }
  .input:disabled { opacity: 0.5; }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
  }

  .section-label {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .asset-row { display: flex; align-items: center; gap: var(--space-2); min-height: 36px; }

  .thumb { width: 36px; height: 36px; object-fit: cover; border-radius: var(--radius-sm, 4px); flex-shrink: 0; }

  .type-badge {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px var(--space-2);
    flex-shrink: 0;
  }

  .asset-label {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .asset-label--empty { color: var(--color-text-faint); font-style: italic; }

  .btn-ghost {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 var(--space-1);
    transition: color var(--ease-fast);
    flex-shrink: 0;
  }

  .btn-ghost:hover { color: var(--color-text-muted); }

  .actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }

  .btn-primary, .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    border: none;
    transition: opacity var(--ease-fast);
  }

  .btn-primary { background: var(--color-accent); color: #000; }
  .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--color-text-muted); border: 1px solid var(--color-border); }
  .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary:hover:not(:disabled), .btn-secondary:hover:not(:disabled) { opacity: 0.85; }
</style>
