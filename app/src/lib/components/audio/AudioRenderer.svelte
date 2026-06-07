<script lang="ts">
  import { onDestroy } from "svelte";
  import type { ReactiveAudioState } from "$lib/types/state";
  import { ambienceEngine } from "$lib/engines/ambienceEngine";
  import { musicEngine } from "$lib/engines/musicEngine";

  let { state }: { state: ReactiveAudioState } = $props();

  onDestroy(() => {
    ambienceEngine.reset();
    musicEngine.reset();
  });

  // Plain let — not reactive, so reading inside $effect creates no dependency.
  // Acts as a record of the previous run's IDs to distinguish ID changes from
  // volume-only changes without firing both engine calls simultaneously.
  let prevAmbienceIds: string[] = [];

  $effect(() => {
    const ambiences = state.ambiences ?? [];
    const ids = ambiences.map((a) => a.id);
    if (ids.join(",") !== prevAmbienceIds.join(",")) {
      prevAmbienceIds = ids;
      ambienceEngine.syncActive(ambiences);
    } else {
      for (const a of ambiences) ambienceEngine.setVolume(a.id, a.volume);
    }
  });

  // undefined as sentinel so the first run always triggers setPlaylist,
  // even when the initial id is null.
  let prevMusicId: string | null | undefined = undefined;

  $effect(() => {
    const id = state.music?.id ?? null;
    const vol = state.music?.volume ?? 0.5;
    if (id !== prevMusicId) {
      prevMusicId = id;
      musicEngine.setPlaylist(id, vol);
    } else {
      musicEngine.setVolume(vol);
    }
  });

  // Reset audio: version counter acts as an event signal. Starts at 0 so
  // the initial mount run is a no-op.
  $effect(() => {
    if (!state.resetAudioVersion) return;
    ambienceEngine.hardReset(state.ambiences ?? []);
    musicEngine.hardReset(state.music?.id ?? null);
  });
</script>
