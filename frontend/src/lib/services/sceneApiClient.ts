import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { Scene, SceneCategory } from "@/types/scene";

class SceneApiClient {
  private withUrl(scene: Scene): Scene {
    const bg = scene.background;
    return {
      ...scene,
      background: {
        ...bg,
        url: assetUrl(bg.src),
        thumb_url: bg.thumb_src ? assetUrl(bg.thumb_src) : null,
      },
      layers: scene.layers.map((layer) => ({ ...layer, url: assetUrl(layer.src) })),
    };
  }

  async fetchSceneCategories(): Promise<SceneCategory[]> {
    return apiClient.get<SceneCategory[]>("/scene/categories");
  }

  async fetchScenes(): Promise<Scene[]> {
    const scenes = await apiClient.get<Scene[]>("/scene");
    return scenes.map((scene) => this.withUrl(scene));
  }

  async fetchScene(sceneId: string): Promise<Scene> {
    const scene = await apiClient.get<Scene>(`/scene/${sceneId}`);
    return this.withUrl(scene);
  }

  async createScene(scene: Scene): Promise<Scene> {
    return apiClient.post<Scene>("/scene", scene);
  }

  async updateScene(sceneId: string, scene: Scene): Promise<Scene> {
    return apiClient.put<Scene>(`/scene/${sceneId}`, scene);
  }

  async deleteScene(sceneId: string): Promise<Scene> {
    return apiClient.delete<Scene>(`/scene/${sceneId}`);
  }
}

export const sceneApiClient = new SceneApiClient();
