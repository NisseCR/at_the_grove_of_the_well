import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all ambience categories sorted by display order. */
export function GET() {
  return json(get().ambience_categories);
}
