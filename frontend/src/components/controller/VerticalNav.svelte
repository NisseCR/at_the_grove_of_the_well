<script lang="ts">
  interface Props {
    items: string[];
    elements: HTMLElement[];
  }

  const { items, elements }: Props = $props();

  let activeIndex = $state(0);

  $effect(() => {
    if (elements.length === 0) return;

    const scroller = findScrollParent(elements[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = elements.indexOf(entry.target as HTMLElement);
            if (i !== -1) activeIndex = i;
          }
        }
      },
      { root: scroller, rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  });

  function findScrollParent(el: HTMLElement): HTMLElement | null {
    let p = el.parentElement;
    while (p) {
      const { overflowY } = getComputedStyle(p);
      if (overflowY === "auto" || overflowY === "scroll") return p;
      p = p.parentElement;
    }
    return null;
  }

  function scrollTo(i: number): void {
    const el = elements[i];
    if (!el) return;
    const scroller = findScrollParent(el);
    if (!scroller) return;
    const offset = el.offsetTop - scroller.offsetTop;
    scroller.scrollTo({ top: offset, behavior: "smooth" });
  }
</script>

<nav class="vertical-nav">
  {#each items as item, i}
    <button
      class="nav-item"
      class:active={activeIndex === i}
      onclick={() => scrollTo(i)}
    >
      <span class="nav-label">{item}</span>
    </button>
  {/each}
</nav>

<style>
  .vertical-nav {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding-top: var(--space-1);
    border-right: 1px solid var(--color-border);
    padding-right: var(--space-3);
  }

  .nav-item {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-1) 0;
  }

  .nav-label {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: capitalize;
    color: var(--color-text-faint);
    transition: color var(--ease-fast);
    white-space: nowrap;
  }

  .nav-item:hover .nav-label {
    color: var(--color-text-muted);
  }

  .nav-item.active .nav-label {
    color: var(--color-accent);
  }
</style>
