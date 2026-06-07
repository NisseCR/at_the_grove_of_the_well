import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all playlists with their covers and tracks. */
export function GET() {
  return json(get().playlists);
}
