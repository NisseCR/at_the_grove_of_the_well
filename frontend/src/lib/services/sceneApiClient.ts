import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { Scene, SceneCategory } from "@/types/scene";

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

class SceneApiClient {
  /**
   * @returns All scene categories with their scene entries.
   */
  async fetchSceneCategories(): Promise<SceneCategory[]> {
    return apiClient.get<SceneCategory[]>("/scene/categories");
  }

  /**
   * @returns All scenes with their backgrounds and layers.
   */
  async fetchScenes(): Promise<Scene[]> {
    const scenes = await apiClient.get<Scene[]>("/scene");
    return scenes.map(resolveScene);
  }

  /**
   * @returns A single scene by id.
   */
  async fetchScene(id: string): Promise<Scene> {
    const scene = await apiClient.get<Scene>(`/scene/${id}`);
    return resolveScene(scene);
  }
}

export const sceneApiClient = new SceneApiClient();
