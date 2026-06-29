import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import {
  DEFAULT_AMBIENCE_TARGET_GAIN,
  DEFAULT_AMBIENCE_VOLUME_GAIN,
  DEFAULT_MUSIC_TARGET_GAIN,
  DEFAULT_MUSIC_VOLUME_GAIN,
} from "$lib/config/audio";
import type { TransportMessage } from "$lib/types/message";

/** Clamp a parsed float to [0, 1], falling back to `fallback` if NaN. */
function parseVol(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const v = parseFloat(s);
  return isNaN(v) ? fallback : Math.max(0, Math.min(1, v));
}

/** Parse playlist param: "id:volume" → { id, volume } or null if absent. */
function parsePlaylist(
  param: string | null,
): { id: string; volume: number } | null {
  if (!param) return null;
  const [id, vol] = param.split(":");
  return id ? { id, volume: parseVol(vol, DEFAULT_MUSIC_VOLUME_GAIN) } : null;
}

/** Parse ambiences param: "id:volume,id:volume" → array of { id, volume }. */
function parseAmbiences(
  param: string | null,
): Array<{ id: string; volume: number }> {
  if (!param) return [];
  return param.split(",").flatMap((entry) => {
    const [id, vol] = entry.split(":");
    return id ? [{ id, volume: parseVol(vol, DEFAULT_AMBIENCE_VOLUME_GAIN) }] : [];
  });
}

/** Build a single SYNC message carrying scene, ambience selection, and volumes. */
function buildSyncMessage(
  sceneId: string | null,
  playlist: { id: string; volume: number } | null,
  ambiences: Array<{ id: string; volume: number }>,
): TransportMessage {
  return {
    type: "SYNC",
    payload: {
      scene: sceneId ? { id: sceneId } : null,
      ambiences: ambiences.map(({ id, volume }) => ({
        id,
        label: null,
        targetGain: DEFAULT_AMBIENCE_TARGET_GAIN,
        volumeGain: volume,
      })),
      playlists: playlist
        ? {
            id: playlist.id,
            label: null,
            targetGain: DEFAULT_MUSIC_TARGET_GAIN,
            volumeGain: playlist.volume,
          }
        : null,
    },
  };
}

/** POST messages to the ws-relay broadcast endpoint. */
async function broadcastMessages(messages: TransportMessage[]): Promise<void> {
  const wsRelayUrl = env.WS_RELAY_URL ?? "http://localhost:8000";
  const res = await fetch(`${wsRelayUrl}/api/control/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Relay responded ${res.status}`);
}

/**
 * Apply a full player state preset via URL params.
 *
 * Params: ?scene=ID&playlist=ID:volume&ambiences=ID:volume,ID:volume
 *
 * Absent params clear that part of the state (e.g. no ?scene= removes the scene).
 * Returns a minimal page that attempts to close itself so the tab disappears.
 */
export async function GET({ url }): Promise<Response> {
  const sceneId = url.searchParams.get("scene") || null;
  const playlist = parsePlaylist(url.searchParams.get("playlist"));
  const ambiences = parseAmbiences(url.searchParams.get("ambiences"));

  try {
    await broadcastMessages([buildSyncMessage(sceneId, playlist, ambiences)]);
  } catch (e) {
    throw error(503, `Relay unavailable: ${e}`);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0}body{background:#08060e}</style></head><body><script>window.close();setTimeout(()=>{location.replace('about:blank')},100)<\/script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
