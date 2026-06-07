import type { Scene } from "$lib/types/scene";
import type { ActiveMusic } from "$lib/types/state";
import type { AmbienceRef } from "$lib/types/reader";

export const readerState = $state({
  current: null as Scene | null,
  next: null as Scene | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
  overlayOpacity: 0,
  ambiences: null as AmbienceRef[] | null,
  music: null as ActiveMusic | null,
  resetAudioVersion: 0,
});
