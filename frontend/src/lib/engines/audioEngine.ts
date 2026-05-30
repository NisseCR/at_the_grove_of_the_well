import * as Tone from "tone";
import type { Stem } from "@/types/audio";

class AudioEngine {
  /** Decoded audio buffers keyed by URL, retained after a stem is deactivated. */
  private cache = new Map<string, Tone.ToneAudioBuffer>();

  /**
   * Fetches and decodes audio at the given URL, storing the buffer in the
   * cache so subsequent stem creation does not re-download the file.
   * No-ops if the URL is already cached.
   *
   * @param url - Remote URL of the audio file to preload.
   */
  async preload(url: string): Promise<void> {
    if (this.cache.has(url)) return;
    const player = new Tone.Player(url);
    await Tone.loaded();
    this.cache.set(url, player.buffer);
    player.dispose();
  }

  /**
   * Creates a new {@link Stem} from the cached buffer for the given URL,
   * preloading it first if necessary. The player is not started — the caller
   * is responsible for configuring and starting it.
   *
   * @param url - Remote URL of the audio file.
   * @returns A stem with a gain node connected to the destination at volume 0.
   */
  async createStem(url: string): Promise<Stem> {
    await this.preload(url);
    const player = new Tone.Player(this.cache.get(url)!);
    const gain = new Tone.Gain(0).toDestination();
    player.connect(gain);
    return { player, gain };
  }

  /**
   * Fades a gain node to a target value over the given duration.
   * Anchors the current value with `cancelAndHoldAtTime` before ramping so
   * that calling this mid-fade starts from the actual current level rather
   * than snapping to the last scheduled value.
   *
   * @param gain     - The gain node to ramp.
   * @param target   - Target gain value (0–1).
   * @param duration - Ramp duration in seconds.
   */
  fadeTo(gain: Tone.Gain, target: number, duration: number): void {
    const now = Tone.now();
    const param = gain.gain;
    param.cancelAndHoldAtTime(now);
    param.linearRampToValueAtTime(target, now + duration);
  }

  /**
   * Evicts the decoded buffer for the given URL from the cache.
   * Call this when a stem is permanently removed from a scene to free memory.
   *
   * @param url - Remote URL whose cached buffer should be released.
   */
  dispose(url: string): void {
    this.cache.delete(url);
  }
}

export const audioEngine = new AudioEngine();
