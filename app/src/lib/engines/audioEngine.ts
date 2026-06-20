import * as Tone from "tone";
import type { Stem } from "$lib/types/audio";
import type { TargetGain } from "$lib/types/state";
import { createLogger } from "$lib/utils/logger";

const log = createLogger("audio:engine");

class AudioEngine {
  /**
   * Signal chain: player → rampGain(0) → volumeGain(1) → destination.
   */
  async createStem(url: string): Promise<Stem> {
    const player = await new Tone.Player().load(url);
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
  fadeGainTo(gain: Tone.Gain, target: TargetGain, duration: number): void {
    const now = Tone.now();
    gain.gain.cancelAndHoldAtTime(now);
    gain.gain.linearRampToValueAtTime(target, now + duration);
    log.debug(`fade gain: ${gain.gain.value} -> ${target} over ${duration}s`);
  }

  async closeAudioContext(): Promise<void> {
    const context = Tone.getContext().rawContext as AudioContext;
    if (context.state !== "closed") {
      await context.close();
      log.debug("closed audio context");
    } else {
      log.debug("audio context already closed");
    }
  }

  /**
   * Create a fresh {@link AudioContext} to reset potential drift in created audio stems.
   * All existing nodes become invalid after this call, so callers must dispose their stems before calling reset.
   */
  async refreshAudioContext(): Promise<void> {
    this.closeAudioContext();

    Tone.setContext(new Tone.Context());
    await Tone.start();

    log.debug("refreshed audio context");
  }
}

export const audioEngine = new AudioEngine();
