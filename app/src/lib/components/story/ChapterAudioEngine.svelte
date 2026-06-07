<script lang="ts">
  import type { ChapterFrontmatter, ChapterSegment } from '$lib/types/story';
  import type { ReactiveAudioState } from '$lib/types/state';
  import AudioRenderer from '$lib/components/audio/AudioRenderer.svelte';

  let {
    frontmatter,
    segments,
    activeTriggerIndex,
  }: {
    frontmatter: ChapterFrontmatter;
    segments: ChapterSegment[];
    activeTriggerIndex: number;
  } = $props();

  const localAudio: ReactiveAudioState = $state({
    ambiences: null,
    music: null,
    resetAudioVersion: 0,
  });

  // Apply full audio state snapshot whenever the active trigger changes.
  // activeTriggerIndex === -1 means above all triggers — use frontmatter defaults.
  $effect(() => {
    if (activeTriggerIndex === -1) {
      localAudio.ambiences = frontmatter.ambiences;
      localAudio.music = frontmatter.playlist
        ? { id: frontmatter.playlist.id, label: null, volume: frontmatter.playlist.volume }
        : null;
    } else {
      const trigger = segments[activeTriggerIndex].trigger!;
      localAudio.ambiences = trigger.ambiences;
      localAudio.music = trigger.playlist
        ? { id: trigger.playlist.id, label: null, volume: trigger.playlist.volume }
        : null;
    }
  });
</script>

<AudioRenderer state={localAudio} />
