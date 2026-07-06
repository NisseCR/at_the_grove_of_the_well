<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import type { ReactiveAudioState } from "$lib/types/state";
  import { ambienceEngine } from "$lib/engines/ambienceEngine";
  import type { AmbienceId, TargetGain, VolumeGain } from "$lib/types/state";
  import { musicEngine } from "$lib/engines/musicEngine";
  import {
    DEFAULT_AMBIENCE_TARGET_GAIN,
    DEFAULT_AMBIENCE_VOLUME_GAIN,
  } from "$lib/config/audio";

  let { state }: { state: ReactiveAudioState } = $props();

  onDestroy(() => {
    ambienceEngine.reset();
    musicEngine.reset();
  });

  // Fires when activeIds or targetGains change — covers both ambience activation
  // and cinematic volume transitions from triggers or SET_AMBIENCE_VOLUME.
  // volumeGains are read untracked so slider moves don't retrigger transitions.
  $effect(() => {
    const ids = state.ambiences.ids;

    const targetGainMap = new Map<AmbienceId, TargetGain>(
      ids.map((id) => [
        id,
        state.ambiences.targetGains[id] ?? DEFAULT_AMBIENCE_TARGET_GAIN,
      ]),
    );

    const volumeGainMap = new Map<AmbienceId, VolumeGain>(
      untrack(() =>
        ids.map((id) => [
          id,
          state.ambiences.volumeGains[id] ?? DEFAULT_AMBIENCE_VOLUME_GAIN,
        ]),
      ),
    );

    ambienceEngine
      .transition(targetGainMap, volumeGainMap)
      .catch(() => toast.error("Ambience failed to load"));
  });

  // Fires only on slider mutations — sets volumeGain instantly without
  // interfering with any ongoing rampGain fade.
  $effect(() => {
    const volumeGains = state.ambiences.volumeGains;

    for (const [id, volume] of Object.entries(volumeGains))
      ambienceEngine.setVolume(id, volume);
  });

  // Distinguishes a playlist switch (id or targetGain changed — routed through
  // transition(), which applies volumeGain itself only once the new track
  // takes over) from a live volume tweak against the still-playing track
  // (applied instantly via setVolume()). Without this split, a volumeGain
  // bundled into the same update as an id change (e.g. from the /apply route)
  // would slam the outgoing track's volume mid-fade instead of waiting for
  // the incoming track to start.
  let prevPlaylistId: string | null = null;
  let prevPlaylistTargetGain: TargetGain | null = null;

  $effect(() => {
    const id = state.playlists.id;
    const targetGain = state.playlists.targetGain;
    const volumeGain = state.playlists.volumeGain;

    const switching = id !== prevPlaylistId || targetGain !== prevPlaylistTargetGain;
    prevPlaylistId = id;
    prevPlaylistTargetGain = targetGain;

    if (switching) {
      musicEngine
        .transition(id, targetGain, volumeGain)
        .catch(() => toast.error("Music failed to load"));
    } else {
      musicEngine.setVolume(volumeGain);
    }
  });

  // Reset audio: version counter acts as an event signal. Starts at 0 so
  // the initial mount run is a no-op. State is read under untrack so that
  // ambience/music changes don't re-trigger a full reset.
  $effect(() => {
    if (!state.resetAudioVersion) return;

    untrack(() => {
      const targetGainMap = new Map<AmbienceId, TargetGain>(
        state.ambiences.ids.map((id) => [
          id,
          state.ambiences.targetGains[id] ?? DEFAULT_AMBIENCE_TARGET_GAIN,
        ]),
      );
      const volumeGainMap = new Map<AmbienceId, VolumeGain>(
        state.ambiences.ids.map((id) => [
          id,
          state.ambiences.volumeGains[id] ?? 1.0,
        ]),
      );

      ambienceEngine
        .hardReset(targetGainMap, volumeGainMap)
        .catch(() => toast.error("Audio reset failed"));

      musicEngine
        .hardReset(state.playlists.id)
        .catch(() => toast.error("Music reset failed"));
    });
  });
</script>
