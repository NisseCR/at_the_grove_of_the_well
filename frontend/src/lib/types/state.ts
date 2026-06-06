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

/** Minimum shape required by AudioReactor. Both AppState and readerState satisfy this. */
export interface ReactiveAudioState {
  ambiences: { id: string; volume: number }[] | null;
  music: ActiveMusic | null;
  resetAudioVersion: number;
}

export interface AppState extends ReactiveAudioState {
  socketConnected: boolean;
  renderReady: boolean;
  debug: boolean;
  scene: ActiveScene | null;
  handout: ActiveHandout | null;
  ambiences: ActiveAmbience[] | null;
  clientConnectedVersion: number;
}
