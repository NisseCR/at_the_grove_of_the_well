import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Svelte action: plays a one-shot fade-in when the element enters the viewport.
 * The animation runs at its own pace regardless of scroll speed.
 * Once visible, the element stays visible — no fade-out, no replay.
 */
export function scrollReveal(node: HTMLElement) {
  gsap.set(node, { opacity: 0 });

  const trigger = ScrollTrigger.create({
    trigger: node,
    start: "top 82%",
    once: true,
    onEnter: () => {
      gsap.to(node, { opacity: 1, duration: 1.2, ease: "power2.out" });
    },
  });

  return {
    destroy() {
      trigger.kill();
    },
  };
}
