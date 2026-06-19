import * as Tone from "tone";
import type { Stem } from "$lib/types/audio";
import { LruCache } from "$lib/utils/lruCache";
import { createLogger } from "$lib/utils/logger";

const log = createLogger("audio:engine");

class AudioEngine {
  private cache = new LruCache<string, Tone.ToneAudioBuffer>(2);

  /**
   * {@link Tone.ToneAudioBuffer.load} returns {@link AudioBuffer}, thus it is necessary to wrap it in a {@link Tone.ToneAudioBuffer}.
   */
  async preloadStem(url: string): Promise<void> {
    if (this.cache.has(url)) {
      log.debug("cached", url);
      return;
    }
    const audioBuffer = await Tone.ToneAudioBuffer.load(url);
    this.cache.set(url, new Tone.ToneAudioBuffer(audioBuffer));
    log.debug("loaded", url);
  }

  /**
   * Signal chain: player → rampGain(0) → volumeGain(1) → destination.
   */
  async createStem(url: string): Promise<Stem> {
    await this.preloadStem(url);
    const audioBuffer = this.cache.get(url);

    const player = new Tone.Player(audioBuffer);
    const volumeGain = new Tone.Gain(1);
    const rampGain = new Tone.Gain(0);

    player.chain(rampGain, volumeGain, Tone.getDestination());
    log.debug("created stem for", url);
    return { player, rampGain, volumeGain, url };
  }

  async disposeStem(stem: Stem): Promise<void> {
    stem.player.stop();
    stem.player.dispose();
    stem.rampGain.dispose();
    stem.volumeGain.dispose();
    log.debug("disposed stem for", stem.url);
  }

  /**
   * Anchor the current value with {@link AudioParam.cancelAndHoldAtTime} before ramping so
   * that calling this mid-fade starts from the actual current level rather
   * than snapping to the last scheduled value.
   */
  fadeGainTo(gain: Tone.Gain, target: number, duration: number): void {
    const now = Tone.now();
    gain.gain.cancelAndHoldAtTime(now);
    gain.gain.linearRampToValueAtTime(target, now + duration);
    log.debug("fadeGainTo", { current: gain.gain.value, target, duration });
  }

  /**
   * Create a fresh {@link AudioContext} to reset potential drift in created audio stems.
   * All existing nodes become invalid after this call, so callers must dispose their stems before calling reset.
   */
  async reset(): Promise<void> {
    const context = Tone.getContext().rawContext as AudioContext;
    if (context.state !== "closed") {
      await context.close();
    }

    Tone.setContext(new Tone.Context());
    await Tone.start();

    this.cache.clear();
    log.debug("reset audio context");
  }
}

export const audioEngine = new AudioEngine();
