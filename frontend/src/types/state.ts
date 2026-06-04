export interface ActiveScene {
  id: string;
}

export interface ActiveAmbience {
  id: string;
  volume: number;
}

export interface ActiveMusic {
  id: string | null;
  volume: number;
}

export interface ActiveHandout {
  id: string;
}

export interface AppState {
  socketConnected: boolean;
  audioReady: boolean;
  scene: ActiveScene | null;
  music: ActiveMusic | null;
  ambiences: ActiveAmbience[] | null;
  handout: ActiveHandout | null;
}
