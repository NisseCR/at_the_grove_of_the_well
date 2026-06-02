export type SceneMessage =
  | { type: "SET_SCENE"; payload: { sceneId: string } }
  | { type: "SYNC_SCENE"; payload: { sceneId: string | null } };

export type AmbienceMessage =
  | {
      type: "SET_AMBIENCES";
      payload: { ambiences: { id: string; volume: number }[] };
    }
  | { type: "SET_AMBIENCE_VOLUME"; payload: { id: string; volume: number } };

export type MusicMessage =
  | { type: "SET_PLAYLIST"; payload: { playlistId: string | null } }
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
        ambiences: { id: string; volume: number }[] | null;
        music: { playlistId: string | null; volume: number } | null;
      };
    }
  | { type: "RESET_AUDIO" };
