import { json, error } from '@sveltejs/kit';
import { get } from '$lib/server/appData';
import type { RequestHandler } from './$types';

/** Return a single playlist by its slug ID. */
export const GET: RequestHandler = ({ params }) => {
  const playlist = get().playlists.find(p => p.id === params.id);
  if (!playlist) throw error(404, `Playlist '${params.id}' not found`);
  return json(playlist);
};
