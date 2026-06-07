import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return the story index (all stories with their chapter metadata). */
export function GET() {
  return json(get().stories);
}
