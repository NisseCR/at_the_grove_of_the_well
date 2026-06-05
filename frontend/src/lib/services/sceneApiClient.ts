import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type {
  BackgroundEditor,
  LayerEditor,
  LayerProperties,
  Scene,
  SceneCategory,
  SceneEditor,
} from "@/types/scene";

/** Fields accepted when creating a scene. */
export interface SceneCreatePayload {
  label: string;
  slug?: string;
}

/** Fields accepted when patching a scene. */
export type ScenePatchPayload = Partial<SceneCreatePayload>;

/** Patch the background asset and/or visual properties. */
export interface BackgroundPatchPayload extends Partial<LayerProperties> {
  image_asset_id?: string | null;
  video_asset_id?: string | null;
}

/** Add a layer — exactly one asset id should be set. */
export interface LayerCreatePayload {
  image_asset_id?: string;
  video_asset_id?: string;
}

/** Patch a layer's asset and/or visual properties. */
export interface LayerPatchPayload extends Partial<LayerProperties> {
  image_asset_id?: string | null;
  video_asset_id?: string | null;
}

/** Fields accepted when creating/patching a scene category. */
export interface SceneCategoryCreatePayload {
  label: string;
  display_order?: number;
}

export type SceneCategoryPatchPayload = Partial<SceneCategoryCreatePayload>;

function resolveScene(scene: Scene): Scene {
  const bg = scene.background;
  return {
    ...scene,
    background: {
      ...bg,
      url: bg.src ? assetUrl(bg.src) : undefined,
      thumb_url: bg.thumb_src ? assetUrl(bg.thumb_src) : null,
    },
    layers: scene.layers.map((l) => ({ ...l, url: assetUrl(l.src) })),
  };
}

function resolveSceneEditor(scene: SceneEditor): SceneEditor {
  const bg = scene.background;
  return {
    ...scene,
    background: {
      ...bg,
      thumb_url: bg.thumb_src ? assetUrl(bg.thumb_src) : null,
    },
    layers: scene.layers.map((l): LayerEditor => ({ ...l, url: assetUrl(l.asset_id) })),
  };
}

class SceneApiClient {
  // ---------------------------------------------------------------------------
  // Scene reads (used by controller + engine)
  // ---------------------------------------------------------------------------

  /** @returns All scene categories with their scene entries. */
  async fetchSceneCategories(): Promise<SceneCategory[]> {
    return apiClient.get<SceneCategory[]>("/scene/categories");
  }

  /** @returns All scenes with their backgrounds and layers. */
  async fetchScenes(): Promise<Scene[]> {
    const scenes = await apiClient.get<Scene[]>("/scene");
    return scenes.map(resolveScene);
  }

  /** @returns A single scene by UUID. */
  async fetchScene(sceneId: string): Promise<Scene> {
    const scene = await apiClient.get<Scene>(`/scene/${sceneId}`);
    return resolveScene(scene);
  }

  // ---------------------------------------------------------------------------
  // Scene editor reads
  // ---------------------------------------------------------------------------

  /** @returns A single scene in editor format (includes layer_id, asset labels). */
  async fetchSceneEditor(sceneId: string): Promise<SceneEditor> {
    const scene = await apiClient.get<SceneEditor>(`/scene/${sceneId}/editor`);
    return resolveSceneEditor(scene);
  }

  // ---------------------------------------------------------------------------
  // Scene writes
  // ---------------------------------------------------------------------------

  /**
   * Create a new scene with a blank background.
   * @param payload - Initial field values.
   */
  async createScene(payload: SceneCreatePayload): Promise<SceneEditor> {
    const scene = await apiClient.post<SceneEditor>("/scene", payload);
    return resolveSceneEditor(scene);
  }

  /**
   * Update a scene's label or slug.
   * @param id - Scene UUID.
   * @param patch - Fields to update.
   */
  async patchScene(id: string, patch: ScenePatchPayload): Promise<SceneEditor> {
    const scene = await apiClient.patch<SceneEditor>(`/scene/${id}`, patch);
    return resolveSceneEditor(scene);
  }

  /**
   * Permanently delete a scene, its background, and all layers.
   * @param id - Scene UUID.
   */
  async deleteScene(id: string): Promise<void> {
    await apiClient.delete<void>(`/scene/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Background writes
  // ---------------------------------------------------------------------------

  /**
   * Update the scene background's asset and/or visual properties.
   * Providing image_asset_id clears video_asset_id and vice versa.
   * @param sceneId - Scene UUID.
   * @param patch - Fields to update.
   */
  async patchBackground(sceneId: string, patch: BackgroundPatchPayload): Promise<BackgroundEditor> {
    const bg = await apiClient.patch<BackgroundEditor>(`/scene/${sceneId}/background`, patch);
    return { ...bg, thumb_url: bg.thumb_src ? assetUrl(bg.thumb_src) : null };
  }

  // ---------------------------------------------------------------------------
  // Layer writes
  // ---------------------------------------------------------------------------

  /**
   * Append a new layer to a scene.
   * @param sceneId - Scene UUID.
   * @param payload - Asset to link.
   */
  async addLayer(sceneId: string, payload: LayerCreatePayload): Promise<LayerEditor> {
    return apiClient.post<LayerEditor>(`/scene/${sceneId}/layers`, payload);
  }

  /**
   * Update a layer's asset and/or visual properties.
   * @param sceneId - Scene UUID.
   * @param layerId - Layer UUID.
   * @param patch - Fields to update.
   */
  async patchLayer(sceneId: string, layerId: string, patch: LayerPatchPayload): Promise<LayerEditor> {
    return apiClient.patch<LayerEditor>(`/scene/${sceneId}/layers/${layerId}`, patch);
  }

  /**
   * Remove a layer from a scene.
   * @param sceneId - Scene UUID.
   * @param layerId - Layer UUID.
   */
  async deleteLayer(sceneId: string, layerId: string): Promise<void> {
    await apiClient.delete<void>(`/scene/${sceneId}/layers/${layerId}`);
  }

  /**
   * Set the order of all layers in a scene.
   * @param sceneId - Scene UUID.
   * @param layerIds - Ordered list of layer UUIDs.
   */
  async reorderLayers(sceneId: string, layerIds: string[]): Promise<void> {
    await apiClient.post<void>(`/scene/${sceneId}/layers/reorder`, { layer_ids: layerIds });
  }

  // ---------------------------------------------------------------------------
  // Category writes
  // ---------------------------------------------------------------------------

  /**
   * Create a new scene category.
   * @param payload - Initial field values.
   */
  async createCategory(payload: SceneCategoryCreatePayload): Promise<SceneCategory> {
    return apiClient.post<SceneCategory>("/scene/categories", payload);
  }

  /**
   * Update a scene category.
   * @param id - Category UUID.
   * @param patch - Fields to update.
   */
  async patchCategory(id: string, patch: SceneCategoryPatchPayload): Promise<SceneCategory> {
    return apiClient.patch<SceneCategory>(`/scene/categories/${id}`, patch);
  }

  /**
   * Permanently delete a scene category. Linked scenes are not deleted.
   * @param id - Category UUID.
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete<void>(`/scene/categories/${id}`);
  }

  /**
   * Add a scene to a category.
   * @param categoryId - Category UUID.
   * @param sceneId - Scene UUID.
   */
  async addSceneToCategory(categoryId: string, sceneId: string): Promise<void> {
    await apiClient.post<void>(`/scene/categories/${categoryId}/scenes/${sceneId}`, {});
  }

  /**
   * Remove a scene from a category.
   * @param categoryId - Category UUID.
   * @param sceneId - Scene UUID.
   */
  async removeSceneFromCategory(categoryId: string, sceneId: string): Promise<void> {
    await apiClient.delete<void>(`/scene/categories/${categoryId}/scenes/${sceneId}`);
  }
}

export const sceneApiClient = new SceneApiClient();
