import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all playlist categories sorted by display order. */
export function GET() {
  return json(get().playlist_categories);
}
