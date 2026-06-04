export type SceneMessage =
  | { type: "SET_SCENE"; payload: { sceneId: string; label: string | null } }
  | { type: "SYNC_SCENE"; payload: { sceneId: string | null } };

export type AmbienceMessage =
  | {
      type: "SET_AMBIENCES";
      payload: { ambiences: { id: string; label: string | null; volume: number }[] };
    }
  | { type: "SET_AMBIENCE_VOLUME"; payload: { id: string; volume: number } };

export type MusicMessage =
  | { type: "SET_PLAYLIST"; payload: { id: string | null; label: string | null } }
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
        ambiences: { id: string; label: string | null; volume: number }[] | null;
        music: { id: string | null; label: string | null; volume: number } | null;
      };
    }
  | { type: "RESET_AUDIO" }
  | { type: "SET_DEBUG"; payload: { debug: boolean } };
