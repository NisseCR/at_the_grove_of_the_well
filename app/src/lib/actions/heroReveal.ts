import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

/**
 * Svelte action: types the text content of the first two children sequentially.
 * Adds a zero-width CSS cursor (via .typing class) during each phase so no
 * layout shift occurs when the cursor disappears.
 */
export function heroReveal(node: HTMLElement, params?: { onComplete?: () => void }) {
  const label = node.children[0] as HTMLElement;
  const title = node.children[1] as HTMLElement;

  const labelText = label.textContent ?? '';
  const titleText = title.textContent ?? '';

  label.textContent = '';
  title.textContent = '';

  label.classList.add('typing');

  gsap.to(label, {
    duration: Math.max(0.6, labelText.length * 0.09),
    text: { value: labelText, delimiter: '' },
    ease: 'none',
    onComplete: () => {
      label.classList.remove('typing');
      title.classList.add('typing');

      gsap.to(title, {
        delay: 0.7,
        duration: Math.max(1.0, titleText.length * 0.08),
        text: { value: titleText, delimiter: '' },
        ease: 'none',
        onComplete: () => {
          title.classList.remove('typing');
          params?.onComplete?.();
        },
      });
    },
  });

  return {
    destroy() {
      gsap.killTweensOf(label);
      gsap.killTweensOf(title);
      label.classList.remove('typing');
      title.classList.remove('typing');
    },
  };
}
