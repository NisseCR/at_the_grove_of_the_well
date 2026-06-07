<script lang="ts">
  import { untrack, onDestroy } from "svelte";
  import type { ReactiveAudioState } from "$lib/types/state";
  import { ambienceEngine } from "$lib/engines/ambienceEngine";
  import { musicEngine } from "$lib/engines/musicEngine";

  let { state }: { state: ReactiveAudioState } = $props();

  onDestroy(() => {
    ambienceEngine.reset();
    musicEngine.reset();
  });

  // Fires when the active ambience id list changes. untrack prevents the
  // syncActive call from creating a volume dependency on the full entries —
  // volume changes are handled by the effect below.
  $effect(() => {
    (state.ambiences ?? []).map((a) => a.id);
    untrack(() => ambienceEngine.syncActive(state.ambiences ?? []));
  });

  // Fires when any individual ambience volume changes. setVolume is a no-op
  // for ambiences not yet active, so ordering with syncActive is safe.
  $effect(() => {
    if (!state.ambiences) return;
    for (const a of state.ambiences) {
      ambienceEngine.setVolume(a.id, a.volume);
    }
  });

  // Fires when the playlist id changes.
  $effect(() => {
    musicEngine.setPlaylist(state.music?.id ?? null);
  });

  // Fires when the master music volume changes.
  $effect(() => {
    musicEngine.setVolume(state.music?.volume ?? 0.5);
  });

  // Reset audio: version counter acts as an event signal. Starts at 0 so
  // the initial mount run is a no-op.
  $effect(() => {
    if (!state.resetAudioVersion) return;
    ambienceEngine.hardReset(state.ambiences ?? []);
    musicEngine.hardReset(state.music?.id ?? null);
  });
</script>
