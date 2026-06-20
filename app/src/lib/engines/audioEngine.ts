import * as Tone from "tone";
import type { GainControl, Stem } from "$lib/types/audio";
import type { TargetGain } from "$lib/types/state";
import { createLogger } from "$lib/utils/logger";

const log = createLogger("audio:engine");

class AudioEngine {
  /**
   * Signal chain: player → rampGain(0) → volumeGain(1) → destination.
   */
  async createStem(url: string): Promise<Stem> {
    log.debug(`creating stem for ${url}`);

    const player = await new Tone.Player().load(url);
    const rampGain = { node: new Tone.Gain(0), target: 0 };
    const volumeGain = { node: new Tone.Gain(1), target: 1 };
    player.chain(rampGain.node, volumeGain.node, Tone.getDestination());
    return { player, rampGain, volumeGain, url };
  }

  async disposeStem(stem: Stem): Promise<void> {
    log.debug(`disposing stem for ${stem.url}`);

    stem.player.stop();
    stem.player.dispose();
    stem.rampGain.node.dispose();
    stem.volumeGain.node.dispose();
  }

  /**
   * Anchor the current value with {@link AudioParam.cancelAndHoldAtTime} before ramping so
   * that calling this mid-fade starts from the actual current level rather
   * than snapping to the last scheduled value.
   */
  fadeGainTo(
    control: GainControl,
    target: TargetGain,
    duration: number,
  ): Promise<void> {
    log.debug(
      `fading gain: ${control.node.gain.value.toFixed(2)} -> ${target.toFixed(2)} over ${duration}s`,
    );

    const now = Tone.now();
    control.node.gain.cancelAndHoldAtTime(now);
    control.node.gain.linearRampToValueAtTime(target, now + duration);
    control.target = target;
    return new Promise((resolve) => setTimeout(resolve, duration * 1000));
  }

  async closeAudioContext(): Promise<void> {
    log.debug("closing audio context");

    const context = Tone.getContext().rawContext as AudioContext;
    if (context.state !== "closed") {
      await context.close();
    } else {
      log.debug("audio context already closed");
    }
  }

  /**
   * Create a fresh {@link AudioContext} to reset potential drift in created audio stems.
   * All existing nodes become invalid after this call, so callers must dispose their stems before calling reset.
   */
  async refreshAudioContext(): Promise<void> {
    log.debug("refreshing audio context");

    this.closeAudioContext();
    Tone.setContext(new Tone.Context());
    await Tone.start();
  }
}

export const audioEngine = new AudioEngine();
