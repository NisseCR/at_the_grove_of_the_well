// Rune state for websocket status.

export const connectionState = $state({
  status: "disconnected" as "connected" | "disconnected" | "reconnecting",
});
