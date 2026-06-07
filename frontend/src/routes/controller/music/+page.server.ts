import type { Playlist, PlaylistCategory } from '$lib/types/music';
import type { PageServerLoad } from './$types';

/** Load playlist categories and playlists for the controller tab. */
export const load: PageServerLoad = async ({ fetch }) => {
  const [categories, playlists] = await Promise.all([
    fetch('/api/music/playlist/categories').then<PlaylistCategory[]>(r => r.json()),
    fetch('/api/music/playlist').then<Playlist[]>(r => r.json()),
  ]);
  return { categories, playlists };
};
