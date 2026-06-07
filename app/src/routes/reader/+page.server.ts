import { get } from '$lib/server/appData';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  return { stories: get().stories };
};
