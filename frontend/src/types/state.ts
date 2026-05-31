export interface ActiveScene {
  id: string;
}

export interface ActiveAmbience {
  id: string;
  volume: number;
}

export interface ActiveMusic {
  id: string;
  volume: number;
  mood: number;
  intensity: number;
}

export interface ActiveHandout {
  id: string;
}

export interface AppState {
  socketConnected: boolean;
  scene: ActiveScene | null;
  music: ActiveMusic | null;
  ambiences: ActiveAmbience[] | null;
  handout: ActiveHandout | null;
}
