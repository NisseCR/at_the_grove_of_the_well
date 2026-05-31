export type SceneMessage =
  | { type: "SET_SCENE"; payload: { sceneId: string } }
  | { type: "SYNC_SCENE"; payload: { sceneId: string | null } };

export type AmbienceMessage =
  | { type: "SYNC_AMBIENCES"; payload: { ambienceIds: string[] } }
  | { type: "RESET_AUDIO" };

export type MusicMessage =
  | { type: "SET_INTENSITY"; payload: { intensity: number } }
  | { type: "SET_MOOD"; payload: { mood: number } };

export type TransportMessage =
  | SceneMessage
  | AmbienceMessage
  | MusicMessage
  | { type: "CLIENT_CONNECTED" }
  | { type: "SYNC" };
