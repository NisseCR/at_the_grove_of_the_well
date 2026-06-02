import type { AppState } from "@/types/state";

export const appState = $state<AppState>({
  socketConnected: false,
  audioReady: false,
  scene: null,
  music: null,
  ambiences: null,
  handout: null,
});
