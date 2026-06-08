import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ cookies }) => {
  return { isAuthed: !!cookies.get("CF_Authorization") };
};
