import { json, error } from '@sveltejs/kit';
import { load, get } from '$lib/server/appData';

/** Re-scan R2 and local scene configs, rebuild in-memory data. */
export async function POST() {
  try {
    await load();
  } catch (err) {
    throw error(500, `Sync failed: ${err}`);
  }

  const data = get();
  return json({
    last_synced: data.last_synced ?? '',
    ambience_categories: data.ambience_categories.length,
    ambiences: data.ambiences.length,
    playlist_categories: data.playlist_categories.length,
    playlists: data.playlists.length,
    scene_categories: data.scene_categories.length,
    scenes: data.scenes.length,
  });
}
