import { get } from '$lib/server/appData';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { StoryChapter } from '$lib/types/story';

export const load: PageServerLoad = ({ params }) => {
  const data = get();
  const chapter = data.chapters[`${params.story}/${params.chapter}`];
  if (!chapter) error(404, 'Chapter not found');

  const story = data.stories.find((s) => s.slug === params.story);
  const chapters = story?.chapters ?? [];
  const idx = chapters.findIndex((c) => c.slug === params.chapter);

  const prev: StoryChapter | null = idx > 0 ? chapters[idx - 1] : null;
  const next: StoryChapter | null = idx < chapters.length - 1 ? chapters[idx + 1] : null;

  return { chapter, storyLabel: story?.label ?? params.story, storySlug: params.story, prev, next };
};
