// import * as Tone from "tone";
// import { readerState } from "$lib/stores/readerState.svelte";
// import { ambienceEngine } from "$lib/engines/ambienceEngine";
// import { musicEngine } from "$lib/engines/musicEngine";
// import type {
//   ParsedReader,
//   ReaderFrontmatter,
//   ReaderTrigger,
// } from "$lib/types/reader";
// import type { ActiveMusic } from "$lib/types/state";

// /**
//  * ReaderEngine — coordinates audio-visual state for the immersive reader.
//  * Mirrors the role of messageHandler in the player, but driven by scroll
//  * triggers instead of WebSocket messages. No WebSocket involvement.
//  *
//  * Audio is driven reactively: applyFrontmatter and applyTrigger update
//  * readerState, and AudioReactor responds. Nothing starts until the page
//  * mounts AudioReactor after unlock().
//  */
// class ReaderEngine {
//   private parsed: ParsedReader | null = null;
//   private lastTriggerIdx = -1;

//   /**
//    * Register a parsed story. Does not start audio or scene — waits for unlock().
//    *
//    * @param parsed - The parsed reader document to register.
//    */
//   setStory(parsed: ParsedReader): void {
//     this.parsed = parsed;
//     this.lastTriggerIdx = -1;
//   }

//   /**
//    * Initialise Tone.js on the user's gesture, then apply the story's
//    * frontmatter state (scene + ambiences + playlist) into readerState.
//    * The page mounts AudioReactor after this resolves.
//    */
//   async unlock(): Promise<void> {
//     await Tone.start();
//     if (this.parsed) this.applyFrontmatter(this.parsed.frontmatter);
//   }

//   /**
//    * Evaluate scroll position against sentinel elements and fire the
//    * appropriate trigger when the active sentinel changes.
//    * Call this from a scroll event listener on the content container.
//    *
//    * @param contentEl - The scrollable content container.
//    */
//   checkTriggers(contentEl: HTMLElement): void {
//     const rect = contentEl.getBoundingClientRect();
//     const triggerLine = rect.top + rect.height * 0.3;

//     const sentinels = contentEl.querySelectorAll<HTMLElement>("[data-trigger]");
//     let newIdx = -1;
//     for (let i = 0; i < sentinels.length; i++) {
//       if (sentinels[i].getBoundingClientRect().top <= triggerLine) newIdx = i;
//       else break;
//     }

//     if (newIdx === this.lastTriggerIdx) return;
//     this.lastTriggerIdx = newIdx;

//     if (newIdx === -1) {
//       if (this.parsed) this.applyFrontmatter(this.parsed.frontmatter);
//     } else {
//       const raw = sentinels[newIdx].dataset.trigger;
//       if (raw) this.applyTrigger(JSON.parse(raw) as ReaderTrigger);
//     }
//   }

//   /**
//    * Stop all audio and reset reader state. Call when navigating away
//    * from a story or unmounting the view.
//    */
//   reset(): void {
//     musicEngine.reset();
//     ambienceEngine.syncActive([]);
//     readerState.current = null;
//     readerState.next = null;
//     readerState.isTransitioning = false;
//     readerState.requestedSceneId = null;
//     readerState.overlayOpacity = 0;
//     readerState.ambiences = null;
//     readerState.music = null;
//     readerState.resetAudioVersion = 0;
//     this.parsed = null;
//     this.lastTriggerIdx = -1;
//   }

//   /**
//    * @param fm - Frontmatter from the parsed story.
//    */
//   private applyFrontmatter(fm: ReaderFrontmatter): void {
//     if (fm.scene) readerState.requestedSceneId = fm.scene;
//     if (fm.ambiences !== undefined) readerState.ambiences = fm.ambiences;
//     if (fm.playlist !== undefined) readerState.music = playlistToMusic(fm.playlist);
//   }

//   /**
//    * @param trigger - Trigger payload parsed from a sentinel element.
//    */
//   private applyTrigger(trigger: ReaderTrigger): void {
//     if (trigger.scene) readerState.requestedSceneId = trigger.scene;
//     if (trigger.ambiences !== undefined) readerState.ambiences = trigger.ambiences;
//     if (trigger.playlist !== undefined) readerState.music = playlistToMusic(trigger.playlist);
//   }
// }

// /**
//  * @param playlist - PlaylistRef or null from frontmatter/trigger.
//  */
// function playlistToMusic(playlist: { id: string; volume: number } | null | undefined): ActiveMusic | null {
//   if (!playlist) return null;
//   return { id: playlist.id, label: null, volume: playlist.volume };
// }

// export const readerEngine = new ReaderEngine();
