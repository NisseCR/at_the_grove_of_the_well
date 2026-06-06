import * as Tone from "tone";
import { readerState } from "@/stores/readerState.svelte";
import { ambienceEngine } from "@/lib/engines/ambienceEngine";
import { musicEngine } from "@/lib/engines/musicEngine";
import type {
  ParsedReader,
  ReaderFrontmatter,
  ReaderTrigger,
} from "@/types/reader";

/**
 * ReaderEngine — coordinates audio-visual state for the immersive reader.
 * Mirrors the role of messageHandler in the player, but driven by scroll
 * triggers instead of WebSocket messages. No WebSocket involvement.
 *
 * Nothing starts until unlock() is called on a user gesture, matching
 * the same gate behaviour as PlayerView.
 */
class ReaderEngine {
  private parsed: ParsedReader | null = null;
  private lastTriggerIdx = -1;

  /** Register a parsed story. Does not start audio or scene — waits for unlock(). */
  setStory(parsed: ParsedReader): void {
    this.parsed = parsed;
    this.lastTriggerIdx = -1;
  }

  /**
   * Initialise Tone.js on the user's gesture, then apply the story's
   * frontmatter state (scene + ambiences + playlist) — same sequencing as StoryGate.
   */
  async unlock(): Promise<void> {
    await Tone.start();
    readerState.audioReady = true;
    if (this.parsed) await this.applyFrontmatter(this.parsed.frontmatter);
  }

  /**
   * Evaluate scroll position against sentinel elements and fire the
   * appropriate trigger when the active sentinel changes.
   * Call this from a scroll event listener on the content container.
   *
   * @param contentEl - The scrollable content container.
   */
  async checkTriggers(contentEl: HTMLElement): Promise<void> {
    const rect = contentEl.getBoundingClientRect();
    const triggerLine = rect.top + rect.height * 0.3;

    const sentinels = contentEl.querySelectorAll<HTMLElement>("[data-trigger]");
    let newIdx = -1;
    for (let i = 0; i < sentinels.length; i++) {
      if (sentinels[i].getBoundingClientRect().top <= triggerLine) newIdx = i;
      else break;
    }

    if (newIdx === this.lastTriggerIdx) return;
    this.lastTriggerIdx = newIdx;

    if (newIdx === -1) {
      if (this.parsed) await this.applyFrontmatter(this.parsed.frontmatter);
    } else {
      const raw = sentinels[newIdx].dataset.trigger;
      if (raw) await this.applyTrigger(JSON.parse(raw) as ReaderTrigger);
    }
  }

  /**
   * Stop all audio and reset reader state. Call when navigating away
   * from a story or unmounting the view.
   */
  reset(): void {
    musicEngine.reset();
    ambienceEngine.syncActive([]);
    readerState.current = null;
    readerState.next = null;
    readerState.isTransitioning = false;
    readerState.requestedSceneId = null;
    readerState.audioReady = false;
    readerState.overlayOpacity = 0;
    this.parsed = null;
    this.lastTriggerIdx = -1;
  }

  private async applyFrontmatter(fm: ReaderFrontmatter): Promise<void> {
    if (fm.scene) readerState.requestedSceneId = fm.scene;
    if (fm.ambiences !== undefined) {
      await ambienceEngine.syncActive(fm.ambiences);
    }
    if (fm.playlist !== undefined) {
      await musicEngine.setPlaylist(
        fm.playlist?.id ?? null,
        fm.playlist?.volume,
      );
    }
  }

  private async applyTrigger(trigger: ReaderTrigger): Promise<void> {
    if (trigger.scene) readerState.requestedSceneId = trigger.scene;
    if (trigger.ambiences !== undefined) {
      await ambienceEngine.syncActive(trigger.ambiences);
    }
    if (trigger.playlist !== undefined) {
      await musicEngine.setPlaylist(
        trigger.playlist?.id ?? null,
        trigger.playlist?.volume,
      );
    }
  }
}

export const readerEngine = new ReaderEngine();
