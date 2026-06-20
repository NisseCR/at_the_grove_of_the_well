import type { AppState } from "$lib/types/state";
import { DEFAULT_MUSIC_VOLUME } from "$lib/config/audio";

export const appState = $state<AppState>({
  socketConnected: false,
  renderReady: false,
  debug: false,
  scene: null,
  handout: null,
  ambiences: {
    ids: [],
    targetGains: {},
    volumeGains: {},
    labels: {},
  },
  playlists: {
    id: null,
    targetGain: DEFAULT_MUSIC_VOLUME,
    volumeGain: 1.0,
    label: null,
  },
  clientConnectedVersion: 0,
  resetAudioVersion: 0,
});
