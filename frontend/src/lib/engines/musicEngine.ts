import * as Tone from "tone";
import { audioEngine } from "$lib/engines/audioEngine";
import { musicApiClient } from "$lib/services/musicApiClient";
import type { Stem } from "$lib/types/audio";
import type { Playlist } from "$lib/types/music";

const FADE_IN = 3.0;
const FADE_OUT = 3.0;
const FADE_VOLUME = 0.1;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

class MusicEngine {
  /**
   * Shared gain node that persists across track changes within a playlist.
   * All track players route through this node, so fading it affects the
   * whole playlist without touching individual players. Lazy-initialised
   * on first use, disposed only on reset().
   */
  private masterGain: Tone.Gain | null = null;

  /** The currently playing Tone.Player. Swapped on every track change. */
  private player: Tone.Player | null = null;

  /** The active playlist. Null when no music is playing. */
  private playlist: Playlist | null = null;

  /** Index into playlist.tracks pointing at the current or next track to play. */
  private trackIndex = 0;

  /** Target gain for the current playlist. Set on setPlaylist, used by fadeInMaster. */
  private targetVolume = 0.5;

  /**
   * Incremented every time setPlaylist or reset is called. Each async
   * operation captures the generation at the time it starts and checks
   * it before proceeding — if the value has changed, a newer call has
   * superseded this one and the operation returns early.
   */
  private generation = 0;

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Switches to the given playlist, or stops music if id is null.
   *
   * If a playlist is currently playing, masterGain fades to 0 first and
   * we wait for the fade to complete before starting the new one — a
   * sequential fade, not a crossfade. If setPlaylist is called again
   * during this wait, the generation check exits early and the newer
   * call takes over.
   *
   * @param id     - Playlist id to start, or null to stop music.
   * @param volume - Target gain for the fade-in (0–1). Defaults to 0.5.
   */
  async setPlaylist(id: string | null, volume = 0.5): Promise<void> {
    this.targetVolume = volume;
    const gen = ++this.generation;

    if (this.playlist && this.masterGain) {
      await this.fadeOutCurrent();
      if (gen !== this.generation) return;
    }

    this.stopPlayer();
    this.playlist = null;
    this.trackIndex = 0;

    if (id === null) return;

    const playlist = await musicApiClient.fetchPlaylist(id);
    if (gen !== this.generation) return;

    this.playlist = playlist;
    await this.playTrack(gen, true);
  }

  /**
   * Fades masterGain to the given volume. No-ops if no playlist is active.
   *
   * @param volume - Target gain value (0–1).
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      audioEngine.fadeTo(this.masterGain, volume, FADE_VOLUME);
    }
  }

  /**
   * Immediately stops all playback and disposes masterGain.
   * Increments generation to cancel any in-flight async operations.
   */
  reset(): void {
    this.generation++;
    this.stopPlayer();
    if (this.masterGain) {
      this.masterGain.dispose();
      this.masterGain = null;
    }
    this.playlist = null;
    this.trackIndex = 0;
  }

  /**
   * Resets all playback state and restarts from the given playlist id.
   * Call this after audioEngine.reset() has created a fresh AudioContext.
   *
   * @param playlistId - Playlist to restart, or null to leave music silent.
   */
  async hardReset(playlistId: string | null): Promise<void> {
    this.reset();
    await this.setPlaylist(playlistId);
  }

  // ─── Playback ──────────────────────────────────────────────────────────────

  /**
   * Loads and starts the track at the current trackIndex. Orchestrates
   * stem loading, audio routing, advance registration, and fade-in.
   *
   * @param gen    - Generation value at call time; guards against superseded calls.
   * @param fadeIn - Whether to fade masterGain in on start. False for auto-advance
   *                 since masterGain is already at the right level.
   */
  private async playTrack(gen: number, fadeIn: boolean): Promise<void> {
    if (!this.playlist) return;

    const track = this.playlist.tracks[this.trackIndex];

    const stem = await audioEngine.createStem(track.url!);
    if (gen !== this.generation) {
      stem.player.dispose();
      stem.gain.dispose();
      return;
    }

    const masterGain = this.getOrCreateMasterGain();
    const player = this.wireStemToMaster(stem, masterGain);
    this.player = player;
    this.registerAdvance(gen, player);
    player.start();

    if (fadeIn) this.fadeInMaster();
  }

  /**
   * Fades masterGain to 0 and waits for the fade to complete.
   * The caller is responsible for checking generation afterwards.
   */
  private async fadeOutCurrent(): Promise<void> {
    audioEngine.fadeTo(this.masterGain!, 0, FADE_OUT);
    await sleep(FADE_OUT * 1000);
  }

  /**
   * Fades masterGain in to the target volume set by the most recent setPlaylist call.
   */
  private fadeInMaster(): void {
    audioEngine.fadeTo(this.masterGain!, this.targetVolume, FADE_IN);
  }

  // ─── Audio graph ───────────────────────────────────────────────────────────

  /**
   * Returns the existing masterGain, or creates and connects a new one at gain 0.
   * If the stored masterGain is on a stale AudioContext (e.g. a reset happened
   * between the context closing and musicEngine.reset() nulling this field),
   * it is disposed and replaced with a fresh node on the current context.
   */
  private getOrCreateMasterGain(): Tone.Gain {
    if (this.masterGain && this.masterGain.context !== Tone.getContext()) {
      this.masterGain.dispose();
      this.masterGain = null;
    }
    if (!this.masterGain) {
      this.masterGain = new Tone.Gain(0).toDestination();
    }
    return this.masterGain;
  }

  /**
   * Disposes the stem's own gain node and rewires the player directly
   * to masterGain, making masterGain the single volume control for all
   * tracks in the playlist.
   *
   * @param stem       - The stem returned by audioEngine.createStem.
   * @param masterGain - The shared gain node to connect the player to.
   * @returns The player, now routed through masterGain.
   */
  private wireStemToMaster(stem: Stem, masterGain: Tone.Gain): Tone.Player {
    stem.gain.dispose();
    stem.player.disconnect();
    stem.player.connect(masterGain);
    return stem.player;
  }

  // ─── Player lifecycle ──────────────────────────────────────────────────────

  /**
   * Registers an onstop callback on the player that advances to the next track
   * when the buffer ends naturally.
   *
   * onstop fires on both natural buffer end and explicit stop() calls. The guard
   * `this.player !== player` distinguishes them: stopPlayer() sets this.player = null
   * before calling stop(), so the callback no-ops on explicit stops.
   *
   * @param gen    - Generation at the time the player was created.
   * @param player - The player to register the callback on.
   */
  private registerAdvance(gen: number, player: Tone.Player): void {
    player.onstop = () => {
      if (gen !== this.generation || !this.playlist || this.player !== player)
        return;
      this.player = null;
      player.dispose();
      this.trackIndex = (this.trackIndex + 1) % this.playlist.tracks.length;
      this.playTrack(gen, false);
    };
  }

  /**
   * Disposes the current player and clears the reference.
   * Sets this.player = null before calling stop() so that the onstop callback
   * knows to no-op when it fires as a result of the explicit stop.
   * Does not touch masterGain — volume state is preserved across track changes.
   */
  private stopPlayer(): void {
    if (this.player) {
      const player = this.player;
      this.player = null;
      try {
        player.stop();
      } catch {}
      player.dispose();
    }
  }
}

export const musicEngine = new MusicEngine();
