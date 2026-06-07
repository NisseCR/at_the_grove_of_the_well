import type { AppState } from "$lib/types/state";

export const appState = $state<AppState>({
  socketConnected: false,
  renderReady: false,
  debug: false,
  scene: null,
  music: null,
  ambiences: null,
  handout: null,
  clientConnectedVersion: 0,
  resetAudioVersion: 0,
});
