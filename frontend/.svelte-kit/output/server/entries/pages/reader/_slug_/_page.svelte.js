import { n as onDestroy, o as attr_style } from "../../../../chunks/index-server.js";
import "../../../../chunks/state.js";
import "../../../../chunks/navigation.js";
import { n as musicEngine, r as ambienceEngine } from "../../../../chunks/sceneApiClient.js";
import { n as SceneRenderer } from "../../../../chunks/StoryGate.js";
import "../../../../chunks/readerApiClient.js";
import * as Tone from "tone";
import "marked";
//#region src/lib/stores/readerState.svelte.ts
var readerState = {
	current: null,
	next: null,
	isTransitioning: false,
	requestedSceneId: null,
	renderReady: false,
	overlayOpacity: 0
};
//#endregion
//#region src/lib/engines/readerEngine.ts
/**
* ReaderEngine — coordinates audio-visual state for the immersive reader.
* Mirrors the role of messageHandler in the player, but driven by scroll
* triggers instead of WebSocket messages. No WebSocket involvement.
*
* Nothing starts until unlock() is called on a user gesture, matching
* the same gate behaviour as PlayerView.
*/
var ReaderEngine = class {
	parsed = null;
	lastTriggerIdx = -1;
	/** Register a parsed story. Does not start audio or scene — waits for unlock(). */
	setStory(parsed) {
		this.parsed = parsed;
		this.lastTriggerIdx = -1;
	}
	/**
	* Initialise Tone.js on the user's gesture, then apply the story's
	* frontmatter state (scene + ambiences + playlist) — same sequencing as StoryGate.
	*/
	async unlock() {
		await Tone.start();
		readerState.renderReady = true;
		if (this.parsed) await this.applyFrontmatter(this.parsed.frontmatter);
	}
	/**
	* Evaluate scroll position against sentinel elements and fire the
	* appropriate trigger when the active sentinel changes.
	* Call this from a scroll event listener on the content container.
	*
	* @param contentEl - The scrollable content container.
	*/
	async checkTriggers(contentEl) {
		const rect = contentEl.getBoundingClientRect();
		const triggerLine = rect.top + rect.height * .3;
		const sentinels = contentEl.querySelectorAll("[data-trigger]");
		let newIdx = -1;
		for (let i = 0; i < sentinels.length; i++) if (sentinels[i].getBoundingClientRect().top <= triggerLine) newIdx = i;
		else break;
		if (newIdx === this.lastTriggerIdx) return;
		this.lastTriggerIdx = newIdx;
		if (newIdx === -1) {
			if (this.parsed) await this.applyFrontmatter(this.parsed.frontmatter);
		} else {
			const raw = sentinels[newIdx].dataset.trigger;
			if (raw) await this.applyTrigger(JSON.parse(raw));
		}
	}
	/**
	* Stop all audio and reset reader state. Call when navigating away
	* from a story or unmounting the view.
	*/
	reset() {
		musicEngine.reset();
		ambienceEngine.syncActive([]);
		readerState.current = null;
		readerState.next = null;
		readerState.isTransitioning = false;
		readerState.requestedSceneId = null;
		readerState.renderReady = false;
		readerState.overlayOpacity = 0;
		this.parsed = null;
		this.lastTriggerIdx = -1;
	}
	async applyFrontmatter(fm) {
		if (fm.scene) readerState.requestedSceneId = fm.scene;
		if (fm.ambiences !== void 0) await ambienceEngine.syncActive(fm.ambiences);
		if (fm.playlist !== void 0) await musicEngine.setPlaylist(fm.playlist?.id ?? null, fm.playlist?.volume);
	}
	async applyTrigger(trigger) {
		if (trigger.scene) readerState.requestedSceneId = trigger.scene;
		if (trigger.ambiences !== void 0) await ambienceEngine.syncActive(trigger.ambiences);
		if (trigger.playlist !== void 0) await musicEngine.setPlaylist(trigger.playlist?.id ?? null, trigger.playlist?.volume);
	}
};
var readerEngine = new ReaderEngine();
//#endregion
//#region src/routes/reader/[slug]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let parsed = null;
		onDestroy(() => readerEngine.reset());
		$$renderer.push(`<div class="reader-bg svelte-ik2ex6">`);
		SceneRenderer($$renderer, { slotState: readerState });
		$$renderer.push(`<!----></div> <div class="reader-overlay svelte-ik2ex6"${attr_style("", { opacity: readerState.overlayOpacity })}></div> `);
		if (!readerState.renderReady && parsed);
		else if (readerState.renderReady && parsed);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };
