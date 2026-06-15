import type { Scene } from "$lib/types/scene";
import type { MusicAudioState, AmbienceAudioState } from "$lib/types/state";
import { DEFAULT_MUSIC_VOLUME } from "$lib/config/audio";

export const readerState = $state({
  current: null as Scene | null,
  next: null as Scene | null,
  isTransitioning: false,
  requestedSceneId: null as string | null,
  overlayOpacity: 0,
  ambiences: {
    activeIds: [],
    targetGains: {},
    volumes: {},
    labels: {},
  } as AmbienceAudioState,
  music: {
    activeId: null,
    targetGain: DEFAULT_MUSIC_VOLUME,
    volume: 1.0,
    label: null,
  } as MusicAudioState,
  resetAudioVersion: 0,
});
