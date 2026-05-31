import type { Stem } from "@/types/audio";
import { audioEngine } from "@/lib/engines/audioEngine";
import { ambienceApiClient } from "@/lib/services/ambienceApiClient";

const FADE_IN = 3.0;
const FADE_OUT = 3.0;
const FADE_VOLUME = 0.1;

class AmbienceEngine {
  /** Currently playing ambience stems keyed by ambience id. */
  private active = new Map<string, Stem>();

  /**
   * Starts playing the ambience stem at the given URL, looping continuously
   * and fading in to the target volume. If the stem is already active, updates
   * its volume via a fade instead of restarting it — safe to call mid-fade.
   *
   * @param id     - Ambience id.
   * @param url    - Remote URL of the audio file.
   * @param volume - Target gain value (0–1).
   */
  async activate(id: string, url: string, volume: number): Promise<void> {
    const existing = this.active.get(id);
    if (existing) {
      audioEngine.fadeTo(existing.gain, volume, FADE_IN);
      return;
    }

    const stem = await audioEngine.createStem(url);
    stem.player.loop = true;
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

  async syncActive(ids: string[]): Promise<void> {
    const incoming = new Set(ids);

    for (const id of this.active.keys()) {
      if (!incoming.has(id)) this.deactivate(id);
    }

    for (const id of incoming) {
      if (!this.active.has(id)) {
        const ambience = await ambienceApiClient.fetchAmbience(id);
        await this.activate(id, ambience.src, 1.0);
      }
    }
  }
}

export const ambienceEngine = new AmbienceEngine();
