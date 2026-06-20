import * as Tone from "tone";
import type { Stem } from "$lib/types/audio";
import type { AmbienceId, TargetGain } from "$lib/types/state";
import { audioEngine } from "$lib/engines/audioEngine";
import type { Ambience } from "$lib/types/ambience";
import { guardedAwait } from "$lib/utils/guardedAwait";
import { createLogger } from "$lib/utils/logger";

const log = createLogger("audio:ambience");

const FADE_IN = 5.0;
const FADE_OUT = 5.0;

class AmbienceEngine {
  /** Currently playing ambience stems keyed by ambience id. */
  private activeAmbiences = new Map<AmbienceId, Stem>();

  /** Token for the current transition call; aborted when a new transition supersedes it. */
  private syncToken: AbortController | null = null;

  /**
   * Supersede any in-progress transitions by guarding between each async step so
   * a newer call cancels the pipeline cleanly.
   */
  async transition(entryAmbiences: Map<AmbienceId, TargetGain>): Promise<void> {
    const token = this.createToken();

    try {
      for (const id of this.activeAmbiences.keys()) {
        if (!entryAmbiences.has(id)) {
          this.deactivateAmbience(id);
        }
      }

      for (const [id, targetGain] of entryAmbiences) {
        if (!this.activeAmbiences.has(id)) {
          this.activateAmbience(id, targetGain, token);
        } else {
          this.updateAmbience(id, targetGain);
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      throw e;
    }
  }

  /**
   * Sets volumeGain for the given stem instantly (no ramp).
   * No-ops if the id is not currently active.
   *
   * @param id     - Ambience id of the stem to adjust.
   * @param volume - Target multiplier (0–1).
   */
  setVolume(id: AmbienceId, volume: number): void {
    const stem = this.activeAmbiences.get(id);
    if (!stem) return;
    stem.volumeGain.node.gain.setValueAtTime(volume, Tone.now());
  }

  /**
   * Immediately stops and disposes all active stems. Aborts any in-progress
   * transition. Does not reset the AudioContext — call hardReset for that.
   */
  reset(): void {
    this.syncToken?.abort();
    this.syncToken = null;

    for (const stem of this.activeAmbiences.values()) {
      audioEngine.disposeStem(stem);
    }
    this.activeAmbiences.clear();
  }

  /**
   * Immediately stops all active stems, resets the AudioContext, then
   * re-activates via transition().
   *
   * @param entries - Map of ambience id to targetGain to activate after the reset.
   */
  async hardReset(entries: Map<AmbienceId, TargetGain>): Promise<void> {
    this.reset();
    await audioEngine.refreshAudioContext();
    await this.transition(entries);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Callers must capture the return value in a local variable. Using
   * `this.syncToken` directly across `await` boundaries is unsafe: a concurrent
   * `transition()` call replaces `this.syncToken` mid-flight, so later
   * `guardedAwait` calls would receive the new (unaborted) token and the old
   * transition would keep running instead of cancelling.
   */
  private createToken(): AbortController {
    this.syncToken?.abort();
    const token = new AbortController();
    this.syncToken = token;
    return token;
  }

  /**
   * Stem is removed from the active map immediately so a concurrent transition can
   * activate a fresh stem while this one fades out.
   */
  private async deactivateAmbience(id: AmbienceId): Promise<void> {
    log.debug(`deactivating ambience ${id}`);

    const stem = this.activeAmbiences.get(id);
    if (!stem) return;

    this.activeAmbiences.delete(id);
    await audioEngine.fadeGainTo(stem.rampGain, 0, FADE_OUT);
    await audioEngine.disposeStem(stem);
  }

  private updateAmbience(id: AmbienceId, targetGain: TargetGain): void {
    const stem = this.activeAmbiences.get(id)!;
    if (stem.rampGain.target !== targetGain)
      audioEngine.fadeGainTo(stem.rampGain, targetGain, FADE_IN);
  }

  private async activateAmbience(
    id: AmbienceId,
    targetGain: TargetGain,
    token: AbortController,
  ): Promise<void> {
    const ambience = await guardedAwait(
      fetch(`/api/ambience/${id}`).then<Ambience>((r) => r.json()),
      token,
    );

    await guardedAwait(
      this.configureAmbienceStem(id, ambience.url!, targetGain, ambience.loop),
      token,
      () => this.deactivateAmbience(id),
    );
  }

  /**
   * Starts a new stem for the given id and fades rampGain in to targetGain.
   * Only called from transition() for ids not yet in the active map.
   */
  private async configureAmbienceStem(
    id: AmbienceId,
    url: string,
    targetGain: TargetGain,
    loop = true,
  ): Promise<void> {
    const stem = await audioEngine.createStem(url);
    stem.player.loop = loop;
    stem.player.start();
    this.activeAmbiences.set(id, stem);
    audioEngine.fadeGainTo(stem.rampGain, targetGain, FADE_IN);
  }
}

export const ambienceEngine = new AmbienceEngine();
