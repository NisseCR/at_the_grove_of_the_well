import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Svelte action: scrub-fades an element in as it enters the viewport from
 * below and out as it approaches the top edge. Bidirectional via scrub.
 */
export function scrollFade(node: HTMLElement) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: node,
      start: 'top 88%',
      end: 'top 8%',
      scrub: true,
    },
  });

  tl.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' })
    .to(node, { opacity: 1, duration: 0.6, ease: 'none' })
    .to(node, { opacity: 0, duration: 0.2, ease: 'none' });

  return {
    destroy() {
      tl.scrollTrigger?.kill();
      tl.kill();
    },
  };
}
