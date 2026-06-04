/**
 * Svelte action that moves the node to document.body, ensuring position:fixed
 * elements cover the full viewport regardless of ancestor CSS constraints.
 */
export function portal(node: HTMLElement): { destroy(): void } {
  document.body.appendChild(node);
  return {
    /** Remove the node from the body when the component is destroyed. */
    destroy() {
      if (node.parentNode) node.parentNode.removeChild(node);
    },
  };
}
