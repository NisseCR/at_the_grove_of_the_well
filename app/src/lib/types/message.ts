import type {
  SceneId,
  HandoutId,
  AmbienceId,
  PlaylistId,
  TargetGain,
  VolumeGain,
} from "$lib/types/state";

export interface SceneWireEntry {
  id: SceneId;
  label: string | null;
}

export interface HandoutWireEntry {
  id: HandoutId;
  label: string | null;
  url: string;
}

export interface AmbienceWireEntry {
  id: AmbienceId;
  label: string | null;
  targetGain: TargetGain;
  volumeGain?: VolumeGain;
}

export interface PlaylistWriteEntry {
  id: PlaylistId | null;
  label: string | null;
  targetGain: TargetGain;
  volumeGain?: VolumeGain;
}

export type SceneMessage =
  | { type: "SET_SCENE"; payload: SceneWireEntry }
  | { type: "SYNC_SCENE"; payload: { id: SceneId | null } };

export type HandoutMessage = {
  type: "SET_HANDOUT";
  payload: HandoutWireEntry | null;
};

export type AmbienceMessage =
  | { type: "SET_AMBIENCES"; payload: AmbienceWireEntry[] }
  | {
      type: "SET_AMBIENCE_VOLUME";
      payload: { id: AmbienceId; volume: VolumeGain };
    };

export type PlaylistMessage =
  | { type: "SET_PLAYLIST"; payload: PlaylistWriteEntry }
  | { type: "SET_PLAYLIST_VOLUME"; payload: { volume: VolumeGain } };

export type SyncMessage = {
  type: "SYNC";
  payload: {
    scene: { id: SceneId } | null;
    handout: HandoutWireEntry | null;
    ambiences: AmbienceWireEntry[] | null;
    playlists: PlaylistWriteEntry | null;
  };
};

export type TransportMessage =
  | SceneMessage
  | HandoutMessage
  | AmbienceMessage
  | PlaylistMessage
  | SyncMessage
  | { type: "CLIENT_CONNECTED" }
  | { type: "RESET_AUDIO" }
  | { type: "SET_DEBUG"; payload: { debug: boolean } };
