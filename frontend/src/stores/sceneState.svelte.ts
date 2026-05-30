import type { SceneConfig } from "@/types/scene";

export const sceneState = $state({
  current: null as SceneConfig | null,
  next: null as SceneConfig | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
});
