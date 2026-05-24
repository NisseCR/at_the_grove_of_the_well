export interface ActiveScene {
  scene_id: string;
}

export interface ActiveAmbience {
  ambience_id: string;
  volume: number;
}

export interface ActiveMusic {
  theme_id: string;
  volume: number;
  mood: number;
  intensity: number;
}

export interface ActiveHandout {
  handount_id: string;
}

export interface AppState {
  scene: ActiveScene | null;
  music: ActiveMusic | null;
  ambiences: ActiveAmbience[] | null;
  handout: ActiveHandout | null;
}
