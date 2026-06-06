import { AUTH_STORAGE_KEY } from "@/stores/auth.svelte";

export type KnownView = "home" | "controller" | "player" | "sync" | "reader";

const PROTECTED_VIEWS: KnownView[] = ["controller", "sync"];

/** Returns true if a valid auth token exists in sessionStorage. */
function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) !== null;
}

/**
 * Derive the current view from the URL pathname.
 * Falls back to "home" for unknown paths or protected views accessed without auth.
 */
function getCurrentView(): KnownView {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const base = parts[0] ?? "";
  if (base === "reader") return "reader";
  if (base === "controller" || base === "player" || base === "sync") {
    if (PROTECTED_VIEWS.includes(base as KnownView) && !isAuthenticated()) return "home";
    return base as KnownView;
  }
  return "home";
}

/** Extract the slug segment from /reader/:slug, or null if absent. */
function getCurrentSlug(): string | null {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "reader" && parts[1] ? parts[1] : null;
}

export const router = $state({ view: getCurrentView(), slug: getCurrentSlug() });

/**
 * Navigate to a view by updating the URL and router state.
 * Pass a slug for sub-routes (e.g. /reader/the-grove).
 * Pass replace=true to replace the current history entry instead of pushing a new one.
 */
export function navigate(view: KnownView, slug?: string | null, replace = false): void {
  const path = view === "home" ? "/" : slug ? `/${view}/${slug}` : `/${view}`;
  replace
    ? window.history.replaceState({}, "", path)
    : window.history.pushState({}, "", path);
  router.view = view;
  router.slug = slug ?? null;
}

/** Keep the router in sync with browser back/forward navigation. */
window.addEventListener("popstate", () => {
  router.view = getCurrentView();
  router.slug = getCurrentSlug();
});
