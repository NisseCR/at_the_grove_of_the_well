<script lang="ts">
  import * as Tone from "tone";
  import { onMount, onDestroy } from "svelte";
  import type { PageData } from "./$types";
  import type { SceneSlotState } from "$lib/types/scene";
  import SceneRenderer from "$lib/components/scene/SceneRenderer.svelte";
  import ChapterHero from "$lib/components/story/ChapterHero.svelte";
  import BeginCta from "$lib/components/story/BeginCta.svelte";
  import ChapterContent from "$lib/components/story/ChapterContent.svelte";
  import AudioTrigger from "$lib/components/story/AudioTrigger.svelte";

  let { data }: { data: PageData } = $props();
  const frontmatter = $derived(data.chapter.frontmatter);
  const segments = $derived(data.chapter.segments);

  let renderReady = $state(false);
  let activeTriggerIndex = $state(-1);
  let overlayOpacity = $state(0);

  const sceneSlot: SceneSlotState = $state({
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

    const sentinels = document.querySelectorAll<HTMLElement>("[data-trigger]");
    const threshold = window.innerHeight * 0.5;
    let newIndex = -1;
    for (const el of sentinels) {
      if (el.getBoundingClientRect().top <= threshold) {
        newIndex = parseInt(el.dataset.trigger!);
      }
    }
    if (newIndex !== activeTriggerIndex) activeTriggerIndex = newIndex;
  }

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
    <SceneRenderer slotState={sceneSlot} requestedSceneId={frontmatter.scene} />
  </div>

  <div class="dark-overlay" style:opacity={overlayOpacity}></div>

  <ChapterContent {segments} />

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
