import type { AmbienceCategory } from '$lib/types/ambience';
import type { PageServerLoad } from './$types';

/** Load ambience categories for the controller tab. */
export const load: PageServerLoad = async ({ fetch }) => {
  const categories = await fetch('/api/ambience/categories').then<AmbienceCategory[]>(r => r.json());
  return { categories };
};
