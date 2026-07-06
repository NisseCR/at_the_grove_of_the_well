export type SceneId = string;
export type HandoutId = string;
export type AmbienceId = string;
export type PlaylistId = string;
export type TargetGain = number;
export type VolumeGain = number;

export interface ActiveScene {
  id: SceneId;
  label: string | null;
}

export interface ActiveHandout {
  id: HandoutId;
  label: string | null;
  url: string;
}

export interface AmbienceAudioState {
  ids: AmbienceId[];
  targetGains: Record<AmbienceId, TargetGain>;
  volumeGains: Record<AmbienceId, VolumeGain>;
  labels: Record<AmbienceId, string | null>;
}

export interface PlaylistAudioState {
  id: PlaylistId | null;
  targetGain: TargetGain;
  volumeGain: VolumeGain;
  label: string | null;
}

/** Minimum shape required by AudioRenderer. Both AppState and AudioTrigger satisfy this. */
export interface ReactiveAudioState {
  ambiences: AmbienceAudioState;
  playlists: PlaylistAudioState;
  resetAudioVersion: number;
}

/** Full application state interface. */
export interface AppState extends ReactiveAudioState {
  socketConnected: boolean;
  renderReady: boolean;
  debug: boolean;
  scene: ActiveScene | null;
  handout: ActiveHandout | null;
  clientConnectedVersion: number;
}
