/**
 * Svelte action: plays a one-shot fade-in when the element enters the viewport.
 * Uses a shared IntersectionObserver so one observer handles all elements on the
 * page rather than creating a new instance per element.
 * Once visible, the element stays visible — no fade-out, no replay.
 */

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

/**
 * Returns the shared IntersectionObserver, creating it lazily on first call.
 * Lazy creation avoids errors during SSR where window is unavailable.
 */
function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callbacks.get(entry.target)?.();
            callbacks.delete(entry.target);
            sharedObserver!.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
  }
  return sharedObserver;
}

export function scrollReveal(node: HTMLElement) {
  node.style.opacity = "0";
  node.style.transition = "opacity 1.2s ease-out";

  callbacks.set(node, () => {
    node.style.opacity = "1";
  });
  getObserver().observe(node);

  return {
    destroy() {
      callbacks.delete(node);
      sharedObserver?.unobserve(node);
    },
  };
}
