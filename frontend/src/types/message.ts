export type SceneMessage =
  | { type: "SET_SCENE"; payload: { sceneId: string } }
  | { type: "SYNC_SCENE"; payload: { sceneId: string | null } };

export type MusicMessage =
  | { type: "SET_INTENSITY"; payload: { intensity: number } }
  | { type: "SET_MOOD"; payload: { mood: number } };

export type AmbienceMessage = {
  type: "SET_AMBIENCE";
  payload: { ambienceId: string };
};

export type TransportMessage =
  | SceneMessage
  | MusicMessage
  | AmbienceMessage
  | { type: "CLIENT_CONNECTED" }
  | { type: "SYNC" };
