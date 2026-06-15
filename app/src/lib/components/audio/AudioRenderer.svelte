<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import type { ReactiveAudioState } from "$lib/types/state";
  import { ambienceEngine } from "$lib/engines/ambienceEngine";
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
    const ids = state.ambiences.activeIds;
    const gains = state.ambiences.targetGains;
    const entries = ids.map((id) => ({
      id,
      targetGain: gains[id] ?? DEFAULT_AMBIENCE_VOLUME,
    }));
    ambienceEngine.transition(entries).catch(() => toast.error("Ambience failed to load"));
  });

  // Fires only on local slider mutations — sets volumeGain instantly without
  // interfering with any ongoing rampGain fade.
  $effect(() => {
    const volumes = state.ambiences.volumes;
    for (const [id, vol] of Object.entries(volumes)) ambienceEngine.setVolume(id, vol);
  });

  // Fires when activeId or targetGain change — covers playlist swaps and
  // cinematic volume transitions from SET_MUSIC_VOLUME.
  $effect(() => {
    const id = state.music.activeId;
    const gain = state.music.targetGain;
    musicEngine.transition(id, gain).catch(() => toast.error("Music failed to load"));
  });

  // Fires only on local slider mutations — sets masterVolumeGain instantly.
  $effect(() => {
    musicEngine.setVolume(state.music.volume);
  });

  // Reset audio: version counter acts as an event signal. Starts at 0 so
  // the initial mount run is a no-op. State is read under untrack so that
  // ambience/music changes don't re-trigger a full reset.
  $effect(() => {
    if (!state.resetAudioVersion) return;
    untrack(() => {
      const entries = state.ambiences.activeIds.map((id) => ({
        id,
        targetGain: state.ambiences.targetGains[id] ?? DEFAULT_AMBIENCE_VOLUME,
      }));
      ambienceEngine.hardReset(entries).catch(() => toast.error("Audio reset failed"));
      musicEngine.hardReset(state.music.activeId).catch(() => toast.error("Music reset failed"));
    });
  });
</script>
