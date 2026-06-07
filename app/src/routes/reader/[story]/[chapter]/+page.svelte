<script lang="ts">
  import * as Tone from 'tone';
  import { onMount, onDestroy } from 'svelte';
  import type { PageData } from './$types';
  import type { SceneSlotState } from '$lib/types/scene';
  import SceneRenderer from '$lib/components/scene/SceneRenderer.svelte';
  import ChapterHero from '$lib/components/story/ChapterHero.svelte';
  import ChapterContent from '$lib/components/story/ChapterContent.svelte';
  import AudioTrigger from '$lib/components/story/AudioTrigger.svelte';

  let { data }: { data: PageData } = $props();
  const { frontmatter, segments } = data.chapter;

  let renderReady = $state(false);
  let activeTriggerIndex = $state(-1);
  let overlayOpacity = $state(0);

  const sceneSlot: SceneSlotState = $state({ current: null, next: null, isTransitioning: false });

  async function unlock(): Promise<void> {
    await Tone.start();
    renderReady = true;
  }

  function onScroll(): void {
    overlayOpacity = Math.min(window.scrollY / window.innerHeight, 0.75);

    const sentinels = document.querySelectorAll<HTMLElement>('[data-trigger]');
    const threshold = window.innerHeight * 0.5;
    let newIndex = -1;
    for (const el of sentinels) {
      if (el.getBoundingClientRect().top <= threshold) {
        newIndex = parseInt(el.dataset.trigger!);
      }
    }
    if (newIndex !== activeTriggerIndex) activeTriggerIndex = newIndex;
  }

  onMount(() => window.addEventListener('scroll', onScroll, { passive: true }));
  onDestroy(() => window.removeEventListener('scroll', onScroll));
</script>

{#if renderReady}
  <div class="scene-layer">
    <SceneRenderer slotState={sceneSlot} requestedSceneId={frontmatter.scene} />
  </div>
  <div class="dark-overlay" style:opacity={overlayOpacity}></div>
{/if}

<ChapterHero
  storyLabel={data.storyLabel}
  chapterTitle={frontmatter.title}
  {renderReady}
  onunlock={unlock}
/>

{#if renderReady}
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
    background: black;
    pointer-events: none;
  }
</style>
