import { json, error } from '@sveltejs/kit';
import { get } from '$lib/server/appData';
import type { RequestHandler } from './$types';

/** Return the fully parsed chapter content for the given story and chapter slugs. */
export const GET: RequestHandler = ({ params }) => {
  const chapter = get().chapters[`${params.story}/${params.chapter}`];
  if (!chapter) error(404, 'Chapter not found');
  return json(chapter);
};
