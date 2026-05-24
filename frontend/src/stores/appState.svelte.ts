import type { AppState } from "@/types/state";

export const appState = $state<AppState>({
  scene: null,
  music: null,
  ambiences: null,
  handout: null,
});
