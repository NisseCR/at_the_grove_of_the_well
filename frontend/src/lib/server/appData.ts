/** In-memory application data, rebuilt on startup and via POST /api/admin/sync. */

import { scan } from './scanner';
import type { AppData } from '$lib/types/appData';

const empty: AppData = {
  ambience_categories: [],
  ambiences: [],
  playlist_categories: [],
  playlists: [],
  scene_categories: [],
  scenes: [],
  last_synced: null,
};

let data: AppData = empty;

/** Re-scan R2 and replace the in-memory data. */
export async function load(): Promise<void> {
  data = await scan();
}

/** Return the current in-memory data. */
export function get(): AppData {
  return data;
}
