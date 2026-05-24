export type KnownView = "home" | "controller" | "player";

/**
 * Get the current view from the live page URL.
 */
function getCurrentView(): KnownView {
  const raw = new URLSearchParams(window.location.search).get("view");
  if (raw === "controller" || raw === "player" || raw === "home") return raw;
  return "home";
}

export const router = $state({ view: getCurrentView() });

/**
 * Update the URL to the given view without reloading the page.
 */
export function navigate(view: KnownView, replace = false): void {
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  replace
    ? window.history.replaceState({}, "", url.toString())
    : window.history.pushState({}, "", url.toString());
  router.view = view;
}

/**
 * Keep store in sync with browser navigation (back/forward).
 */
window.addEventListener("popstate", () => {
  router.view = getCurrentView();
});
