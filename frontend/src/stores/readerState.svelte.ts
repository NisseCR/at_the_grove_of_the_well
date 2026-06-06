import type { Scene } from "@/types/scene";

export const readerState = $state({
  current: null as Scene | null,
  next: null as Scene | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
  audioReady: false,
  overlayOpacity: 0.55,
});
