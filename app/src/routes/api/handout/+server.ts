import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all handouts. */
export function GET() {
  return json(get().handouts);
}
