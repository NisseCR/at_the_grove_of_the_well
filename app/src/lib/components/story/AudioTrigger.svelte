<script lang="ts">
  import type { ChapterFrontmatter, ChapterSegment, AudioRef } from '$lib/types/story';
  import type { AmbienceAudioState, ReactiveAudioState } from '$lib/types/state';
  import { DEFAULT_MUSIC_VOLUME } from '$lib/config/audio';
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

  /** Converts AudioRef[] to AmbienceAudioState. volumes default to 1 (full pass-through). */
  function refsToAmbiences(refs: AudioRef[] | null): AmbienceAudioState {
    const list = refs ?? [];
    return {
      activeIds: list.map((r) => r.id),
      targetGains: Object.fromEntries(list.map((r) => [r.id, r.volume])),
      volumes: {},
      labels: {},
    };
  }

  const localAudio: ReactiveAudioState = $state({
    ambiences: refsToAmbiences(null),
    music: {
      activeId: null,
      targetGain: DEFAULT_MUSIC_VOLUME,
      volume: 1.0,
      label: null,
    },
    resetAudioVersion: 0,
  });

  // Apply full audio state snapshot whenever the active trigger changes.
  // activeTriggerIndex === -1 means above all triggers — use frontmatter defaults.
  $effect(() => {
    const source =
      activeTriggerIndex === -1
        ? { ambiences: frontmatter.ambiences, playlist: frontmatter.playlist }
        : segments[activeTriggerIndex].trigger!;

    localAudio.ambiences = refsToAmbiences(source.ambiences);
    localAudio.music = source.playlist
      ? { activeId: source.playlist.id, targetGain: source.playlist.volume, volume: 1.0, label: null }
      : { activeId: null, targetGain: DEFAULT_MUSIC_VOLUME, volume: 1.0, label: null };
  });
</script>

<AudioRenderer state={localAudio} />
