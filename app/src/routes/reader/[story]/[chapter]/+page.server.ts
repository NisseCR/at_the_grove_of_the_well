import { get } from '$lib/server/appData';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  const chapter = get().chapters[`${params.story}/${params.chapter}`];
  if (!chapter) error(404, 'Chapter not found');
  return { chapter };
};
