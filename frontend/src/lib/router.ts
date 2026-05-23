import { writable } from "svelte/store";

export type KnownView = "home" | "controller" | "player";
export type AppView = KnownView | string;

const DEFAULT_VIEW: KnownView = "home";
const QUERY_KEYS = ["view"] as const;

/**
 * Validate and normalize a raw view string into an AppView.
 *
 * Known values (`home`, `controller`, `player`) are preserved.
 * Any other non-empty string is returned unchanged to allow future views.
 * Null/empty values fall back to the default view.
 *
 * @param raw - raw string from the URL (may be `null`).
 * @returns a validated `AppView`.
 */
export function normalizeView(raw: string | null): AppView {
  if (!raw) return DEFAULT_VIEW;
  const r = raw.trim();
  if (r === "home" || r === "controller" || r === "player") return r;
  return r === "" ? DEFAULT_VIEW : r;
}

/**
 * Read the current URL search string and return the effective AppView.
 * Looks for `?view=...` first, then `?mode=...` for backwards compatibility.
 *
 * @param search - optional search string (defaults to `window.location.search`).
 */
export function getViewFromSearch(search = window.location.search): AppView {
  const params = new URLSearchParams(search);
  for (const key of QUERY_KEYS) {
    const raw = params.get(key);
    if (raw !== null) return normalizeView(raw);
  }
  return DEFAULT_VIEW;
}

/**
 * Get the current view from the live page URL.
 */
export function getCurrentView(): AppView {
  return getViewFromSearch(window.location.search);
}

/**
 * Update the URL to the given view without reloading the page.
 *
 * @param view - the `AppView` to navigate to.
 * @param opts.replace - when true use `history.replaceState`, otherwise push a new entry.
 */
export function navigate(view: AppView, opts: { replace?: boolean } = {}) {
  const url = new URL(window.location.href);
  // write the canonical key `view` so future code uses the clearer param
  url.searchParams.set("view", view);
  if (opts.replace) {
    window.history.replaceState({}, "", url.toString());
  } else {
    window.history.pushState({}, "", url.toString());
  }
  viewStore.set(view);
}

/**
 * A reactive Svelte store that mirrors the current `AppView`.
 * - Initialized from the URL.
 * - Updates on `popstate`.
 * - Call `navigate(...)` to change URL + store.
 */
export const viewStore = writable<AppView>(getCurrentView());

/* keep store in sync with browser navigation (back/forward) */
window.addEventListener("popstate", () => {
  viewStore.set(getCurrentView());
});
