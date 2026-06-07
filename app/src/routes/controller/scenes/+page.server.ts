import type { Scene, SceneCategory } from '$lib/types/scene';
import type { PageServerLoad } from './$types';

/** Load scene categories and scenes for the controller tab. */
export const load: PageServerLoad = async ({ fetch }) => {
  const [categories, scenes] = await Promise.all([
    fetch('/api/scene/categories').then<SceneCategory[]>(r => r.json()),
    fetch('/api/scene').then<Scene[]>(r => r.json()),
  ]);
  return { categories, scenes };
};
