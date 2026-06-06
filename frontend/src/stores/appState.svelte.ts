import type { AppState } from "@/types/state";

export const appState = $state<AppState>({
  socketConnected: false,
  renderReady: false,
  debug: false,
  scene: null,
  music: null,
  ambiences: null,
  handout: null,
});
