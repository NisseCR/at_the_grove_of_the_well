import { json } from '@sveltejs/kit';
import { get } from '$lib/server/appData';

/** Return all ambiences. */
export function GET() {
  return json(get().ambiences);
}
