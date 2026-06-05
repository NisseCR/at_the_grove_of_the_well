import type { Stem } from "@/types/audio";
import { audioEngine } from "@/lib/engines/audioEngine";
import { ambienceApiClient } from "@/lib/services/ambienceApiClient";
import { guardedAwait } from "@/lib/utils/guardedAwait";

const FADE_IN = 5.0;
const FADE_OUT = 5.0;
const FADE_VOLUME = 0.1;

class AmbienceEngine {
  /** Currently playing ambience stems keyed by ambience id. */
  private active = new Map<string, Stem>();
  /** Token for the current syncActive call; aborted when a new sync supersedes it. */
  private syncToken: AbortController | null = null;

  /**
   * Starts playing the ambience stem at the given URL, looping continuously
   * and fading in to the target volume. If the stem is already active, updates
   * its volume via a fade instead of restarting it — safe to call mid-fade.
   *
   * @param id     - Ambience id.
   * @param url    - Remote URL of the audio file.
   * @param volume - Target gain value (0–1).
   */
  async activate(id: string, url: string, volume: number, loop: boolean = true): Promise<void> {
    const existing = this.active.get(id);
    if (existing) {
      audioEngine.fadeTo(existing.gain, volume, FADE_IN);
      return;
    }

    const stem = await audioEngine.createStem(url);
    stem.player.loop = loop;
    stem.player.start();

    this.active.set(id, stem);
    audioEngine.fadeTo(stem.gain, volume, FADE_IN);
  }

  /**
   * Fades out and disposes the active stem for the given ambience id.
   * The stem is removed from the active map immediately, so a concurrent
   * `activate` call can start a fresh stem while this one fades out.
   * No-ops if no stem is currently active for the id.
   *
   * @param id - Ambience id of the stem to deactivate.
   */
  deactivate(id: string): void {
    const stem = this.active.get(id);
    if (!stem) return;

    this.active.delete(id);
    audioEngine.fadeTo(stem.gain, 0, FADE_OUT);

    setTimeout(
      () => {
        stem.player.stop();
        stem.player.dispose();
        stem.gain.dispose();
      },
      (FADE_OUT + 0.1) * 1000,
    );
  }

  /**
   * Fades an active stem to a new volume without stopping it.
   * No-ops if the stem is not currently active.
   *
   * @param id     - Ambience id of the stem to adjust.
   * @param volume - Target gain value (0–1).
   */
  setVolume(id: string, volume: number): void {
    const stem = this.active.get(id);
    if (stem) audioEngine.fadeTo(stem.gain, volume, FADE_VOLUME);
  }

  /**
   * Immediately stops and disposes all active stems, resets the AudioContext,
   * then rebuilds from the given list of ids via syncActive. Use to recover
   * from a drifted state where stems may be playing outside of active.
   *
   * @param ids - The ambience ids to activate after the reset.
   */
  async hardReset(entries: { id: string; volume: number }[]): Promise<void> {
    this.syncToken?.abort();
    this.syncToken = null;

    for (const stem of this.active.values()) {
      stem.player.stop();
      stem.player.dispose();
      stem.gain.dispose();
    }
    this.active.clear();

    await audioEngine.reset();
    await this.syncActive(entries);
  }

  /**
   * Cancels any in-progress sync and creates a new token for the current one.
   * Each syncActive call gets its own token so guards check against the correct sync.
   *
   * @returns A fresh AbortController for the new sync.
   */
  private createToken(): AbortController {
    this.syncToken?.abort();
    const token = new AbortController();
    this.syncToken = token;
    return token;
  }

  /**
   * Reconciles the set of active stems against the given list of entries.
   * Deactivates any stem not in the list, then activates any entry not yet playing.
   * Already-active stems are left untouched — volume is managed separately via setVolume.
   * Supersedes any in-progress sync — guards between each async step so a
   * newer call cancels the pipeline cleanly.
   *
   * @param entries - The complete list of ambiences (id + volume) that should be active.
   */
  async syncActive(entries: { id: string; volume: number }[]): Promise<void> {
    const token = this.createToken();

    try {
      const incoming = new Map(entries.map((e) => [e.id, e.volume]));

      // Deactivate any currently active stem whose id is not in the incoming list.
      for (const id of this.active.keys()) {
        if (!incoming.has(id)) this.deactivate(id);
      }

      // Activate any stem in the incoming list that is not already active.
      for (const [id, volume] of incoming) {
        if (!this.active.has(id)) {
          const ambience = await guardedAwait(
            ambienceApiClient.fetchAmbience(id),
            token,
          );
          await guardedAwait(this.activate(id, ambience.url!, volume, ambience.loop), token, () =>
            this.deactivate(id),
          );
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    }
  }
}

export const ambienceEngine = new AmbienceEngine();
