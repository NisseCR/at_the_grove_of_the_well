import type { Handout, HandoutCategory } from '$lib/types/handout';
import type { PageServerLoad } from './$types';

/** Load handout categories and handouts for the controller tab. */
export const load: PageServerLoad = async ({ fetch }) => {
  const [categories, handouts] = await Promise.all([
    fetch('/api/handout/categories').then<HandoutCategory[]>(r => r.json()),
    fetch('/api/handout').then<Handout[]>(r => r.json()),
  ]);
  return { categories, handouts };
};
