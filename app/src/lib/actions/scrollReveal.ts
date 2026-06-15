/**
 * Svelte action: plays a one-shot fade-in when the element enters the viewport.
 * Uses IntersectionObserver so trigger positions are always live — no stale
 * cached offsets that drift on long pages or after font-load reflow.
 * Once visible, the element stays visible — no fade-out, no replay.
 */
export function scrollReveal(node: HTMLElement) {
  node.style.opacity = "0";
  node.style.transition = "opacity 1.2s ease-out";

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        node.style.opacity = "1";
        observer.disconnect();
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
