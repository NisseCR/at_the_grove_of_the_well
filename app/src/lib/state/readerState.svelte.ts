import type { Scene } from "$lib/types/scene";
import type { PlaylistAudioState, AmbienceAudioState } from "$lib/types/state";
import {
  DEFAULT_MUSIC_TARGET_GAIN,
  DEFAULT_MUSIC_VOLUME_GAIN,
} from "$lib/config/audio";

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
    targetGain: DEFAULT_MUSIC_TARGET_GAIN,
    volumeGain: DEFAULT_MUSIC_VOLUME_GAIN,
    label: null,
  } as PlaylistAudioState,
  resetAudioVersion: 0,
});
