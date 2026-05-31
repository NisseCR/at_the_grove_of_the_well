import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { SceneConfig, SceneCategory } from "@/types/scene";

class SceneApiClient {
  private withUrl(scene: SceneConfig): SceneConfig {
    return {
      ...scene,
      background: { ...scene.background, url: assetUrl(scene.background.src) },
      layers: scene.layers.map((layer) => ({ ...layer, url: assetUrl(layer.src) })),
    };
  }

  async fetchSceneCategories(): Promise<SceneCategory[]> {
    return apiClient.get<SceneCategory[]>("/scene/categories");
  }

  async fetchScenes(): Promise<SceneConfig[]> {
    const scenes = await apiClient.get<SceneConfig[]>("/scene");
    return scenes.map((scene) => this.withUrl(scene));
  }

  async fetchScene(sceneId: string): Promise<SceneConfig> {
    const scene = await apiClient.get<SceneConfig>(`/scene/${sceneId}`);
    return this.withUrl(scene);
  }

  async createScene(scene: SceneConfig): Promise<SceneConfig> {
    return apiClient.post<SceneConfig>("/scene", scene);
  }

  async updateScene(sceneId: string, scene: SceneConfig): Promise<SceneConfig> {
    return apiClient.put<SceneConfig>(`/scene/${sceneId}`, scene);
  }

  async deleteScene(sceneId: string): Promise<SceneConfig> {
    return apiClient.delete<SceneConfig>(`/scene/${sceneId}`);
  }
}

export const sceneApiClient = new SceneApiClient();
