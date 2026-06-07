import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all scenes with their backgrounds and layers. */
export function GET() {
  return json(get().scenes);
}
