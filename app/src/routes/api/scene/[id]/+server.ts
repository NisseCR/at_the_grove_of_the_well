import { json, error } from '@sveltejs/kit';
import { get } from '$lib/server/appData';
import type { RequestHandler } from './$types';

/** Return a single scene by its slug ID. */
export const GET: RequestHandler = ({ params }) => {
  const scene = get().scenes.find(s => s.id === params.id);
  if (!scene) throw error(404, `Scene '${params.id}' not found`);
  return json(scene);
};
