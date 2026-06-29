<script lang="ts">
  import type {
    ChapterFrontmatter,
    ChapterSegment,
    AudioRef,
  } from "$lib/types/story";
  import type {
    AmbienceAudioState,
    ReactiveAudioState,
  } from "$lib/types/state";
  import { DEFAULT_MUSIC_TARGET_GAIN } from "$lib/config/audio";
  import AudioRenderer from "$lib/components/audio/AudioRenderer.svelte";

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
      ids: list.map((r) => r.id),
      targetGains: Object.fromEntries(list.map((r) => [r.id, r.volume])),
      volumeGains: {},
      labels: {},
    };
  }

  const localAudio: ReactiveAudioState = $state({
    ambiences: refsToAmbiences(null),
    playlists: {
      id: null,
      targetGain: DEFAULT_MUSIC_TARGET_GAIN,
      volumeGain: 1.0,
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
    localAudio.playlists = source.playlist
      ? {
          id: source.playlist.id,
          targetGain: source.playlist.volume,
          volumeGain: 1.0,
          label: null,
        }
      : {
          id: null,
          targetGain: DEFAULT_MUSIC_TARGET_GAIN,
          volumeGain: 1.0,
          label: null,
        };
  });
</script>

<AudioRenderer state={localAudio} />
