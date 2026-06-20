import * as Tone from "tone";
import type { Stem } from "$lib/types/audio";
import { audioEngine } from "$lib/engines/audioEngine";
import type { Ambience } from "$lib/types/ambience";
import { guardedAwait } from "$lib/utils/guardedAwait";

const FADE_IN = 5.0;
const FADE_OUT = 5.0;

class AmbienceEngine {
  /** Currently playing ambience stems keyed by ambience id. */
  private active = new Map<string, Stem>();
  /** Token for the current transition call; aborted when a new transition supersedes it. */
  private syncToken: AbortController | null = null;

  /**
   * Reconciles the set of active stems against the given list of entries.
   * For removed ids: fades rampGain to 0 and disposes. For existing ids with
   * a changed targetGain: fades rampGain to the new value (cinematic transition).
   * For new ids: fetches, starts, and fades rampGain from 0 to targetGain.
   * Supersedes any in-progress transition — guards between each async step so
   * a newer call cancels the pipeline cleanly.
   *
   * @param entries - The complete list of ambiences (id + targetGain) that should be active.
   */
  async transition(
    entries: { id: string; targetGain: number }[],
  ): Promise<void> {
    const token = this.createToken();

    try {
      const incoming = new Map(entries.map((e) => [e.id, e.targetGain]));

      for (const id of this.active.keys()) {
        if (!incoming.has(id)) this.deactivate(id);
      }

      for (const [id, targetGain] of incoming) {
        if (this.active.has(id)) {
          audioEngine.fadeGainTo(
            this.active.get(id)!.rampGain,
            targetGain,
            FADE_IN,
          );
        } else {
          const ambience = await guardedAwait(
            fetch(`/api/ambience/${id}`).then<Ambience>((r) => r.json()),
            token,
          );
          await guardedAwait(
            this.activate(id, ambience.url!, targetGain, ambience.loop),
            token,
            () => this.deactivate(id),
          );
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    }
  }

  /**
   * Fades rampGain to 0 and disposes the stem. The stem is removed from the
   * active map immediately so a concurrent transition can activate a fresh stem
   * while this one fades out.
   *
   * @param id - Ambience id of the stem to deactivate.
   */
  deactivate(id: string): void {
    const stem = this.active.get(id);
    if (!stem) return;

    this.active.delete(id);
    audioEngine.fadeGainTo(stem.rampGain, 0, FADE_OUT);

    setTimeout(
      () => {
        audioEngine.disposeStem(stem);
      },
      (FADE_OUT + 0.1) * 1000,
    );
  }

  /**
   * Sets volumeGain for the given stem instantly (no ramp).
   * No-ops if the id is not currently active.
   *
   * @param id     - Ambience id of the stem to adjust.
   * @param volume - Target multiplier (0–1).
   */
  setVolume(id: string, volume: number): void {
    const stem = this.active.get(id);
    if (!stem) return;
    stem.volumeGain.gain.setValueAtTime(volume, Tone.now());
  }

  /**
   * Immediately stops and disposes all active stems. Aborts any in-progress
   * transition. Does not reset the AudioContext — call hardReset for that.
   */
  reset(): void {
    this.syncToken?.abort();
    this.syncToken = null;

    for (const stem of this.active.values()) {
      audioEngine.disposeStem(stem);
    }
    this.active.clear();
  }

  /**
   * Immediately stops all active stems, resets the AudioContext, then
   * re-activates via transition().
   *
   * @param entries - The ambiences to activate after the reset.
   */
  async hardReset(
    entries: { id: string; targetGain: number }[],
  ): Promise<void> {
    this.reset();
    await audioEngine.refreshAudioContext();
    await this.transition(entries);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private createToken(): AbortController {
    this.syncToken?.abort();
    const token = new AbortController();
    this.syncToken = token;
    return token;
  }

  /**
   * Starts a new stem for the given id and fades rampGain in to targetGain.
   * Only called from transition() for ids not yet in the active map.
   */
  private async activate(
    id: string,
    url: string,
    targetGain: number,
    loop = true,
  ): Promise<void> {
    const stem = await audioEngine.createStem(url);
    stem.player.loop = loop;
    stem.player.start();
    this.active.set(id, stem);
    audioEngine.fadeGainTo(stem.rampGain, targetGain, FADE_IN);
  }
}

export const ambienceEngine = new AmbienceEngine();
