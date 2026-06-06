export interface ActiveScene {
  id: string;
  label: string | null;
}

export interface ActiveAmbience {
  id: string;
  label: string | null;
  volume: number;
}

export interface ActiveMusic {
  id: string | null;
  label: string | null;
  volume: number;
}

export interface ActiveHandout {
  id: string;
  label: string | null;
}

export interface AppState {
  socketConnected: boolean;
  renderReady: boolean;
  debug: boolean;
  scene: ActiveScene | null;
  music: ActiveMusic | null;
  ambiences: ActiveAmbience[] | null;
  handout: ActiveHandout | null;
}
