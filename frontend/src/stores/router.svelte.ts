import { AUTH_STORAGE_KEY } from "@/stores/auth.svelte";

export type KnownView = "home" | "controller" | "player" | "sync";

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
  const path = window.location.pathname.replace(/^\//, "");
  if (path === "controller" || path === "player" || path === "sync") {
    if (PROTECTED_VIEWS.includes(path) && !isAuthenticated()) return "home";
    return path;
  }
  return "home";
}

export const router = $state({ view: getCurrentView() });

/**
 * Navigate to a view by updating the URL and the router state.
 * Pass replace=true to replace the current history entry instead of pushing a new one.
 */
export function navigate(view: KnownView, replace = false): void {
  const path = view === "home" ? "/" : `/${view}`;
  replace
    ? window.history.replaceState({}, "", path)
    : window.history.pushState({}, "", path);
  router.view = view;
}

/** Keep the router in sync with browser back/forward navigation. */
window.addEventListener("popstate", () => {
  router.view = getCurrentView();
});
