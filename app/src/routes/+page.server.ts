import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  if (url.searchParams.has('frame_id')) {
    redirect(307, `/activity${url.search}`);
  }
};
