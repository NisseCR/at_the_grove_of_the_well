<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import type { ReactiveAudioState } from "$lib/types/state";
  import { ambienceEngine } from "$lib/engines/ambienceEngine";
  import type { AmbienceId, TargetGain } from "$lib/types/state";
  import { musicEngine } from "$lib/engines/musicEngine";
  import { DEFAULT_AMBIENCE_VOLUME } from "$lib/config/audio";

  let { state }: { state: ReactiveAudioState } = $props();

  onDestroy(() => {
    ambienceEngine.reset();
    musicEngine.reset();
  });

  // Fires when activeIds or targetGains change — covers both ambience activation
  // and cinematic volume transitions from triggers or SET_AMBIENCE_VOLUME.
  $effect(() => {
    const ids = state.ambiences.ids;
    const targetGains = state.ambiences.targetGains;

    const ambiences = new Map<AmbienceId, TargetGain>(
      ids.map((activeId) => [
        activeId,
        targetGains[activeId] ?? DEFAULT_AMBIENCE_VOLUME,
      ]),
    );

    ambienceEngine
      .transition(ambiences)
      .catch(() => toast.error("Ambience failed to load"));
  });

  // Fires only on local slider mutations — sets volumeGain instantly without
  // interfering with any ongoing rampGain fade.
  $effect(() => {
    const volumeGains = state.ambiences.volumeGains;

    for (const [id, volume] of Object.entries(volumeGains))
      ambienceEngine.setVolume(id, volume);
    // TODO only changed volume.
  });

  // Fires when activeId or targetGain change — covers playlist swaps and
  // cinematic volume transitions from SET_MUSIC_VOLUME.
  $effect(() => {
    const id = state.playlists.id;
    const targetGain = state.playlists.targetGain;

    musicEngine
      .transition(id, targetGain)
      .catch(() => toast.error("Music failed to load"));
  });

  // Fires only on local slider mutations — sets masterVolumeGain instantly.
  $effect(() => {
    musicEngine.setVolume(state.playlists.volumeGain);
  });

  // Reset audio: version counter acts as an event signal. Starts at 0 so
  // the initial mount run is a no-op. State is read under untrack so that
  // ambience/music changes don't re-trigger a full reset.
  $effect(() => {
    if (!state.resetAudioVersion) return;

    untrack(() => {
      const ambiences = new Map<AmbienceId, TargetGain>(
        state.ambiences.ids.map((id) => [
          id,
          state.ambiences.targetGains[id] ?? DEFAULT_AMBIENCE_VOLUME,
        ]),
      );

      ambienceEngine
        .hardReset(ambiences)
        .catch(() => toast.error("Audio reset failed"));

      musicEngine
        .hardReset(state.playlists.id)
        .catch(() => toast.error("Music reset failed"));
    });
  });
</script>
