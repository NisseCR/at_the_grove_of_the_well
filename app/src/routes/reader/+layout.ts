import { redirect } from "@sveltejs/kit";

/** Temporarily disabled — reader is being refactored for SvelteKit SSR. */
export const load = () => {
  redirect(307, "/");
};
