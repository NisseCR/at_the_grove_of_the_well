import type { Scene } from "@/types/scene";

export const readerState = $state({
  current: null as Scene | null,
  next: null as Scene | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
  renderReady: false,
  overlayOpacity: 0,
});
