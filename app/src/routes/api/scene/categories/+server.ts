import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all scene categories sorted by display order. */
export function GET() {
  return json(get().scene_categories);
}
