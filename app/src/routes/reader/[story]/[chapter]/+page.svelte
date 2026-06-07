<script lang="ts">
  import * as Tone from 'tone';
  import type { PageData } from './$types';
  import type { SceneSlotState } from '$lib/types/scene';
  import SceneRenderer from '$lib/components/scene/SceneRenderer.svelte';
  import StoryGate from '$lib/components/scene/StoryGate.svelte';
  import ChapterReader from '$lib/components/story/ChapterReader.svelte';
  import ChapterAudioEngine from '$lib/components/story/ChapterAudioEngine.svelte';

  let { data }: { data: PageData } = $props();
  const { frontmatter, segments } = data.chapter;

  let renderReady = $state(false);
  let activeTriggerIndex = $state(-1);

  const sceneSlot: SceneSlotState = $state({ current: null, next: null, isTransitioning: false });

  async function unlock(): Promise<void> {
    await Tone.start();
    renderReady = true;
  }
</script>

{#if !renderReady}
  <StoryGate onunlock={unlock} title={frontmatter.title} />
{:else}
  <div class="scene-layer">
    <SceneRenderer slotState={sceneSlot} requestedSceneId={frontmatter.scene} />
  </div>

  <ChapterReader
    {frontmatter}
    {segments}
    storyLabel={data.storyLabel}
    bind:activeTriggerIndex
  />

  <ChapterAudioEngine {frontmatter} {segments} {activeTriggerIndex} />
{/if}

<style>
  .scene-layer {
    position: fixed;
    inset: 0;
    z-index: 0;
  }
</style>
