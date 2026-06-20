import type { Scene } from "$lib/types/scene";
import type { PlaylistAudioState, AmbienceAudioState } from "$lib/types/state";
import { DEFAULT_MUSIC_VOLUME } from "$lib/config/audio";

export const readerState = $state({
  current: null as Scene | null,
  next: null as Scene | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
  overlayOpacity: 0,
  ambiences: {
    ids: [],
    targetGains: {},
    volumeGains: {},
    labels: {},
  } as AmbienceAudioState,
  music: {
    id: null,
    targetGain: DEFAULT_MUSIC_VOLUME,
    volumeGain: 1.0,
    label: null,
  } as PlaylistAudioState,
  resetAudioVersion: 0,
});
