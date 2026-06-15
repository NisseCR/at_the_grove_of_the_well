export interface ActiveScene {
  id: string;
  label: string | null;
}

export interface ActiveHandout {
  id: string;
  label: string | null;
}

export interface AmbienceAudioState {
  activeIds: string[];
  /** Content-authored loudness per ambience — drives rampGain fades via transition(). */
  targetGains: Record<string, number>;
  /** Per-client slider multiplier — drives volumeGain instantly via setVolume(). */
  volumes: Record<string, number>;
  labels: Record<string, string | null>;
}

export interface MusicAudioState {
  activeId: string | null;
  /** Content-authored loudness — drives masterRampGain fades via transition(). */
  targetGain: number;
  /** Per-client slider multiplier — drives masterVolumeGain instantly via setVolume(). */
  volume: number;
  label: string | null;
}

/** Wire format for a single ambience in WebSocket payloads. */
export interface AmbienceWireEntry {
  id: string;
  label: string | null;
  /** Maps to targetGain in local state — client volume is not sent over wire. */
  volume: number;
}

/** Wire format for music in WebSocket payloads. */
export interface MusicWireEntry {
  id: string | null;
  label: string | null;
  /** Maps to targetGain in local state. */
  volume: number;
}

/** Minimum shape required by AudioRenderer. Both AppState and AudioTrigger satisfy this. */
export interface ReactiveAudioState {
  ambiences: AmbienceAudioState;
  music: MusicAudioState;
  resetAudioVersion: number;
}

export interface AppState extends ReactiveAudioState {
  socketConnected: boolean;
  renderReady: boolean;
  debug: boolean;
  scene: ActiveScene | null;
  handout: ActiveHandout | null;
  clientConnectedVersion: number;
}
