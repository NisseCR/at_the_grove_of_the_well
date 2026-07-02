import * as Tone from "tone";
import { audioEngine } from "$lib/engines/audioEngine";
import type { GainControl, Stem } from "$lib/types/audio";
import type { Playlist } from "$lib/types/music";
import { DEFAULT_MUSIC_TARGET_GAIN, DEFAULT_MUSIC_VOLUME_GAIN } from "$lib/config/audio";
import type { VolumeGain } from "$lib/types/state";
import { createLogger } from "$lib/utils/logger";

const log = createLogger("audio:music");

const FADE_IN = 3.0;
const FADE_OUT = 3.0;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

class MusicEngine {
  /**
   * Shared ramp gain node that persists across track changes within a playlist.
   * All track players route through this node. Fades drive this node only.
   * Lazy-initialised on first use, disposed only on reset().
   */
  private masterRampGain: GainControl | null = null;

  /**
   * Shared volume gain node in series after masterRampGain.
   * setVolume() sets this instantly; never ramped.
   * Lazy-initialised together with masterRampGain, disposed together.
   */
  private masterVolumeGain: Tone.Gain | null = null;

  /** The currently playing Tone.Player. Swapped on every track change. */
  private player: Tone.Player | null = null;

  /** The active playlist. Null when no music is playing. */
  private playlist: Playlist | null = null;

  /** Index into playlist.tracks pointing at the current or next track to play. */
  private trackIndex = 0;

  /** Target gain for the current playlist. Set on transition(), used by fadeInMaster. */
  private targetGain = DEFAULT_MUSIC_TARGET_GAIN;

  /**
   * Incremented every time transition() or reset() is called. Each async
   * operation captures the generation at the time it starts and checks
   * it before proceeding.
   */
  private generation = 0;

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Switches to the given playlist, or stops music if id is null. If the same
   * playlist is already playing, fades masterRampGain to the new targetGain
   * without restarting playback.
   *
   * @param id         - Playlist id to start, or null to stop music.
   * @param targetGain - Target ramp gain for the fade-in (0–1).
   * @param volumeGain - Applied to masterVolumeGain after the playlist starts.
   *                     Only affects newly started playlists; use setVolume() for live updates.
   */
  async transition(
    id: string | null,
    targetGain = DEFAULT_MUSIC_TARGET_GAIN,
    volumeGain: VolumeGain = DEFAULT_MUSIC_VOLUME_GAIN,
  ): Promise<void> {
    this.targetGain = targetGain;

    if (id !== null && this.playlist?.id === id && this.masterRampGain) {
      if (this.masterRampGain.target !== targetGain)
        audioEngine.fadeGainTo(this.masterRampGain, targetGain, FADE_IN);
      return;
    }

    const gen = ++this.generation;

    if (this.playlist && this.masterRampGain) {
      await this.fadeOutCurrent();
      if (gen !== this.generation) return;
    }

    this.stopPlayer();
    this.playlist = null;
    this.trackIndex = 0;

    if (id === null) return;

    const playlist = await fetch(`/api/music/playlist/${id}`).then<Playlist>(
      (r) => r.json(),
    );
    if (gen !== this.generation) return;

    this.playlist = playlist;
    await this.playTrack(gen, true);
    if (gen === this.generation) this.setVolume(volumeGain);
  }

  /**
   * Sets masterVolumeGain instantly (no ramp). No-ops if no music is active.
   *
   * @param volume - Target multiplier (0–1).
   */
  setVolume(volume: number): void {
    if (this.masterVolumeGain) {
      this.masterVolumeGain.gain.setValueAtTime(volume, Tone.now());
    }
  }

  /**
   * Immediately stops all playback and disposes both master gain nodes.
   * Increments generation to cancel any in-flight async operations.
   */
  reset(): void {
    this.generation++;
    this.stopPlayer();
    if (this.masterRampGain) {
      this.masterRampGain.node.dispose();
      this.masterRampGain = null;
    }
    if (this.masterVolumeGain) {
      this.masterVolumeGain.dispose();
      this.masterVolumeGain = null;
    }
    this.playlist = null;
    this.trackIndex = 0;
  }

  /**
   * Resets all playback state and restarts from the given playlist id.
   * Call this after audioEngine.reset() has created a fresh AudioContext.
   *
   * @param id - Playlist to restart, or null to leave music silent.
   */
  async hardReset(id: string | null): Promise<void> {
    this.reset();
    await this.transition(id);
  }

  // ─── Playback ──────────────────────────────────────────────────────────────

  /**
   * Loads and starts the track at the current trackIndex. Orchestrates
   * stem loading, audio routing, advance registration, and fade-in.
   *
   * @param gen    - Generation value at call time; guards against superseded calls.
   * @param fadeIn - Whether to fade masterRampGain in on start.
   */
  private async playTrack(gen: number, fadeIn: boolean): Promise<void> {
    if (!this.playlist) return;

    const track = this.playlist.tracks[this.trackIndex];
    log.debug(`loading track [${this.trackIndex}]: ${track.url}`);

    const stem = await audioEngine.createStem(track.url!);
    if (gen !== this.generation) {
      stem.player.dispose();
      stem.rampGain.node.dispose();
      stem.volumeGain.node.dispose();
      return;
    }

    const masterRampGain = this.getOrCreateMasterGains();
    const player = this.wireStemToMaster(stem, masterRampGain);
    this.player = player;
    this.registerAdvance(gen, player);
    player.start();

    if (fadeIn) this.fadeInMaster();
  }

  /** Fades masterRampGain to 0 and waits for the fade to complete. */
  private async fadeOutCurrent(): Promise<void> {
    audioEngine.fadeGainTo(this.masterRampGain!, 0, FADE_OUT);
    await sleep(FADE_OUT * 1000);
  }

  /** Fades masterRampGain in to the targetGain set by the most recent transition() call. */
  private fadeInMaster(): void {
    audioEngine.fadeGainTo(this.masterRampGain!, this.targetGain, FADE_IN);
  }

  // ─── Audio graph ───────────────────────────────────────────────────────────

  /**
   * Returns the existing masterRampGain (creating both master nodes if needed).
   * If the stored nodes are on a stale AudioContext they are disposed and replaced.
   */
  private getOrCreateMasterGains(): GainControl {
    if (
      this.masterRampGain &&
      this.masterRampGain.node.context !== Tone.getContext()
    ) {
      this.masterRampGain.node.dispose();
      this.masterRampGain = null;
      this.masterVolumeGain?.dispose();
      this.masterVolumeGain = null;
    }
    if (!this.masterRampGain) {
      this.masterVolumeGain = new Tone.Gain(1).toDestination();
      this.masterRampGain = { node: new Tone.Gain(0), target: 0 };
      this.masterRampGain.node.connect(this.masterVolumeGain);
    }
    return this.masterRampGain;
  }

  /**
   * Disposes the stem's own gain nodes and rewires the player directly to
   * masterRampGain, making the master chain the sole volume control.
   *
   * @param stem           - The stem returned by audioEngine.createStem.
   * @param masterRampGain - The shared ramp gain node to connect the player to.
   * @returns The player, now routed through the master chain.
   */
  private wireStemToMaster(stem: Stem, masterRampGain: GainControl): Tone.Player {
    stem.rampGain.node.dispose();
    stem.volumeGain.node.dispose();
    stem.player.disconnect();
    stem.player.connect(masterRampGain.node);
    return stem.player;
  }

  // ─── Player lifecycle ──────────────────────────────────────────────────────

  /**
   * Registers an onstop callback that advances to the next track when the
   * buffer ends naturally. The guard `this.player !== player` distinguishes
   * natural end from explicit stop() calls.
   *
   * @param gen    - Generation at the time the player was created.
   * @param player - The player to register the callback on.
   */
  private registerAdvance(gen: number, player: Tone.Player): void {
    player.onstop = async () => {
      if (gen !== this.generation || !this.playlist || this.player !== player)
        return;
      this.player = null;
      player.dispose();
      this.trackIndex = (this.trackIndex + 1) % this.playlist.tracks.length;
      log.debug(`advancing to track [${this.trackIndex}]`);
      try {
        await this.resumeContext();
        await this.playTrack(gen, false);
      } catch (e) {
        log.error("auto-advance failed:", e);
      }
    };
  }

  private async resumeContext(): Promise<void> {
    const state = Tone.getContext().state;
    if (state !== "running") {
      log.warn(`AudioContext is "${state}" — resuming`);
      await Tone.start();
    }
  }

  /**
   * Disposes the current player and clears the reference.
   * Sets this.player = null before calling stop() so that the onstop callback
   * no-ops on the resulting stop event.
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
