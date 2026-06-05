import type { Scene } from "@/types/scene";

export const sceneState = $state({
  current: null as Scene | null,
  next: null as Scene | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
});
