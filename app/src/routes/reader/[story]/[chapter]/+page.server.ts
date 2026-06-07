import { get } from '$lib/server/appData';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  const data = get();
  const chapter = data.chapters[`${params.story}/${params.chapter}`];
  if (!chapter) error(404, 'Chapter not found');
  const story = data.stories.find((s) => s.slug === params.story);
  return { chapter, storyLabel: story?.label ?? params.story };
};
