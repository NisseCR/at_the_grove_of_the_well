<script lang="ts">
  import * as Tone from "tone";
  import { onMount, onDestroy, tick } from "svelte";
  import type { PageData } from "./$types";
  import type { SceneSlotState } from "$lib/types/scene";
  import SceneRenderer from "$lib/components/scene/SceneRenderer.svelte";
  import ChapterHero from "$lib/components/story/ChapterHero.svelte";
  import BeginCta from "$lib/components/story/BeginCta.svelte";
  import ChapterContent from "$lib/components/story/ChapterContent.svelte";
  import AudioTrigger from "$lib/components/story/AudioTrigger.svelte";
  import ChapterNav from "$lib/components/story/ChapterNav.svelte";

  let { data }: { data: PageData } = $props();
  const frontmatter = $derived(data.chapter.frontmatter);
  const segments = $derived(data.chapter.segments);

  let renderReady = $state(false);
  let activeTriggerIndex = $state(-1);
  let overlayOpacity = $state(0);

  let sceneSlot: SceneSlotState = $state({
    current: null,
    next: null,
    isTransitioning: false,
  });

  async function unlock(): Promise<void> {
    await Tone.start();
    renderReady = true;
  }

  function onScroll(): void {
    overlayOpacity = Math.min(window.scrollY / window.innerHeight, 0.85);
  }

  $effect(() => {
    if (!renderReady) return;
    const active = new Set<number>();
    let observer: IntersectionObserver;

    tick().then(() => {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const index = parseInt((entry.target as HTMLElement).dataset.trigger!);
            if (entry.isIntersecting) {
              active.add(index);
            } else if (entry.boundingClientRect.top > 0) {
              // Element retreated below the threshold — user scrolled back up.
              active.delete(index);
            }
            // If top <= 0 the element scrolled above the viewport; keep it active.
          }
          activeTriggerIndex = active.size > 0 ? Math.max(...active) : -1;
        },
        { rootMargin: "0px 0px -50% 0px" },
      );

      document
        .querySelectorAll<HTMLElement>("[data-trigger]")
        .forEach((el) => observer.observe(el));
    });

    return () => observer?.disconnect();
  });

  onMount(() => {
    document.documentElement.style.overflowY = "scroll";
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  onDestroy(() => {
    document.documentElement.style.overflowY = "";
    window.removeEventListener("scroll", onScroll);
  });
</script>

<ChapterHero storyLabel={data.storyLabel} chapterTitle={frontmatter.title}>
  {#if !renderReady}
    <BeginCta onunlock={unlock} />
  {/if}
</ChapterHero>

{#if renderReady}
  <div class="scene-layer">
    <SceneRenderer bind:slotState={sceneSlot} requestedSceneId={frontmatter.scene} />
  </div>

  <div class="dark-overlay" style:opacity={overlayOpacity}></div>

  <ChapterContent {segments} />

  <ChapterNav storySlug={data.storySlug} prev={data.prev} next={data.next} />

  <AudioTrigger {frontmatter} {segments} {activeTriggerIndex} />
{/if}

<style>
  .scene-layer {
    position: fixed;
    inset: 0;
    z-index: 0;
  }

  .dark-overlay {
    position: fixed;
    inset: 0;
    z-index: 1;
    background: rgb(10, 8, 6);
    pointer-events: none;
  }
</style>
