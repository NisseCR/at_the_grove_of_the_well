import type { AmbienceWireEntry, MusicWireEntry } from "$lib/types/state";

export type SceneMessage =
  | { type: "SET_SCENE"; payload: { sceneId: string; label: string | null } }
  | { type: "SYNC_SCENE"; payload: { sceneId: string | null } };

export type AmbienceMessage =
  | { type: "SET_AMBIENCES"; payload: { ambiences: AmbienceWireEntry[] } }
  | { type: "SET_AMBIENCE_VOLUME"; payload: { id: string; volume: number } };

export type MusicMessage =
  | { type: "SET_PLAYLIST"; payload: MusicWireEntry }
  | { type: "SET_MUSIC_VOLUME"; payload: { volume: number } };

export type TransportMessage =
  | SceneMessage
  | AmbienceMessage
  | MusicMessage
  | { type: "CLIENT_CONNECTED" }
  | {
      type: "SYNC";
      payload: {
        scene: { id: string } | null;
        ambiences: AmbienceWireEntry[] | null;
        music: MusicWireEntry | null;
      };
    }
  | { type: "RESET_AUDIO" }
  | { type: "SET_DEBUG"; payload: { debug: boolean } };
