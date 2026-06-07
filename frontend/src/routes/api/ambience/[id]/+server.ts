import { json, error } from '@sveltejs/kit';
import { get } from '$lib/server/appData';
import type { RequestHandler } from './$types';

/** Return a single ambience by its slug ID. */
export const GET: RequestHandler = ({ params }) => {
  const ambience = get().ambiences.find(a => a.id === params.id);
  if (!ambience) throw error(404, `Ambience '${params.id}' not found`);
  return json(ambience);
};
