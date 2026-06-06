import { i as assetUrl, t as apiClient } from "./apiClient.js";
import * as Tone from "tone";
//#region src/lib/engines/audioEngine.ts
var AudioEngine = class {
	cache = /* @__PURE__ */ new Map();
	/**
	* Fetches and decodes audio at the given URL, storing the buffer in the
	* cache so subsequent stem creation does not re-download the file.
	* No-ops if the URL is already cached.
	*
	* @param url - Remote URL of the audio file to preload.
	*/
	async preload(url) {
		if (this.cache.has(url)) return;
		const audioBuffer = await Tone.ToneAudioBuffer.load(url);
		this.cache.set(url, new Tone.ToneAudioBuffer(audioBuffer));
	}
	/**
	* Creates a new {@link Stem} from the cached buffer for the given URL,
	* preloading it first if necessary. The player is not started — the caller
	* is responsible for configuring and starting it.
	*
	* @param url - Remote URL of the audio file.
	* @returns A stem with a gain node connected to the destination at volume 0.
	*/
	async createStem(url) {
		await this.preload(url);
		const player = new Tone.Player(this.cache.get(url));
		const gain = new Tone.Gain(0).toDestination();
		player.connect(gain);
		return {
			player,
			gain,
			url
		};
	}
	/**
	* Fades a gain node to a target value over the given duration.
	* Anchors the current value with `cancelAndHoldAtTime` before ramping so
	* that calling this mid-fade starts from the actual current level rather
	* than snapping to the last scheduled value.
	*
	* @param gain     - The gain node to ramp.
	* @param target   - Target gain value (0–1).
	* @param duration - Ramp duration in seconds.
	*/
	fadeTo(gain, target, duration) {
		const now = Tone.now();
		const param = gain.gain;
		param.cancelAndHoldAtTime(now);
		param.linearRampToValueAtTime(target, now + duration);
	}
	/**
	* Evicts the decoded buffer for the given URL from the cache.
	* Call this when a stem is permanently removed from a scene to free memory.
	*
	* @param url - Remote URL whose cached buffer should be released.
	*/
	dispose(url) {
		this.cache.delete(url);
	}
	/**
	* Closes the current AudioContext, creates a fresh one, and clears the
	* buffer cache. All existing nodes become invalid after this call —
	* callers must dispose their stems before calling reset.
	*/
	async reset() {
		const ctx = Tone.getContext().rawContext;
		if (ctx.state !== "closed") await ctx.close();
		Tone.setContext(new Tone.Context());
		await Tone.start();
		this.cache.clear();
	}
};
var audioEngine = new AudioEngine();
//#endregion
//#region src/lib/services/ambienceApiClient.ts
var AmbienceApiClient = class {
	/**
	* @returns All ambience categories with their ambience entries.
	*/
	async fetchAmbienceCategories() {
		return (await apiClient.get("/ambience/categories")).map((c) => ({
			...c,
			url: assetUrl(c.src),
			thumb_url: c.thumb_src ? assetUrl(c.thumb_src) : null
		}));
	}
	/**
	* @returns All ambiences with resolved audio URLs.
	*/
	async fetchAmbiences() {
		return (await apiClient.get("/ambience")).map((a) => ({
			...a,
			url: assetUrl(a.src)
		}));
	}
	/**
	* @returns A single ambience with resolved audio URL.
	*/
	async fetchAmbience(id) {
		const ambience = await apiClient.get(`/ambience/${id}`);
		return {
			...ambience,
			url: assetUrl(ambience.src)
		};
	}
};
var ambienceApiClient = new AmbienceApiClient();
//#endregion
//#region src/lib/utils/guardedAwait.ts
/**
* Awaits a promise and then throws an AbortError if the token was aborted
* during the await. Use between async steps in an abortable pipeline to
* cancel superseded operations cleanly.
*
* @param promise  - The promise to await.
* @param token    - The AbortController token for the current pipeline.
* @param onAbort  - Optional cleanup to run before throwing if aborted.
* @returns The resolved value of the promise.
* @throws DOMException with name "AbortError" if the token was aborted.
*/
async function guardedAwait(promise, token, onAbort) {
	const result = await promise;
	if (token.signal.aborted) {
		onAbort?.();
		throw new DOMException("Cancelled", "AbortError");
	}
	return result;
}
//#endregion
//#region src/lib/engines/ambienceEngine.ts
var FADE_IN$1 = 5;
var FADE_OUT$1 = 5;
var FADE_VOLUME$1 = .1;
var AmbienceEngine = class {
	/** Currently playing ambience stems keyed by ambience id. */
	active = /* @__PURE__ */ new Map();
	/** Token for the current syncActive call; aborted when a new sync supersedes it. */
	syncToken = null;
	/**
	* Starts playing the ambience stem at the given URL, looping continuously
	* and fading in to the target volume. If the stem is already active, updates
	* its volume via a fade instead of restarting it — safe to call mid-fade.
	*
	* @param id     - Ambience id.
	* @param url    - Remote URL of the audio file.
	* @param volume - Target gain value (0–1).
	*/
	async activate(id, url, volume, loop = true) {
		const existing = this.active.get(id);
		if (existing) {
			audioEngine.fadeTo(existing.gain, volume, FADE_IN$1);
			return;
		}
		const stem = await audioEngine.createStem(url);
		stem.player.loop = loop;
		stem.player.start();
		this.active.set(id, stem);
		audioEngine.fadeTo(stem.gain, volume, FADE_IN$1);
	}
	/**
	* Fades out and disposes the active stem for the given ambience id.
	* The stem is removed from the active map immediately, so a concurrent
	* `activate` call can start a fresh stem while this one fades out.
	* No-ops if no stem is currently active for the id.
	*
	* @param id - Ambience id of the stem to deactivate.
	*/
	deactivate(id) {
		const stem = this.active.get(id);
		if (!stem) return;
		this.active.delete(id);
		audioEngine.fadeTo(stem.gain, 0, FADE_OUT$1);
		setTimeout(() => {
			stem.player.stop();
			stem.player.dispose();
			stem.gain.dispose();
		}, 5.1 * 1e3);
	}
	/**
	* Fades an active stem to a new volume without stopping it.
	* No-ops if the stem is not currently active.
	*
	* @param id     - Ambience id of the stem to adjust.
	* @param volume - Target gain value (0–1).
	*/
	setVolume(id, volume) {
		const stem = this.active.get(id);
		if (stem) audioEngine.fadeTo(stem.gain, volume, FADE_VOLUME$1);
	}
	/**
	* Immediately stops and disposes all active stems, resets the AudioContext,
	* then rebuilds from the given list of ids via syncActive. Use to recover
	* from a drifted state where stems may be playing outside of active.
	*
	* @param ids - The ambience ids to activate after the reset.
	*/
	async hardReset(entries) {
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
	createToken() {
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
	async syncActive(entries) {
		const token = this.createToken();
		try {
			const incoming = new Map(entries.map((e) => [e.id, e.volume]));
			for (const id of this.active.keys()) if (!incoming.has(id)) this.deactivate(id);
			for (const [id, volume] of incoming) if (!this.active.has(id)) {
				const ambience = await guardedAwait(ambienceApiClient.fetchAmbience(id), token);
				await guardedAwait(this.activate(id, ambience.url, volume, ambience.loop), token, () => this.deactivate(id));
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			throw e;
		}
	}
};
var ambienceEngine = new AmbienceEngine();
//#endregion
//#region src/lib/services/musicApiClient.ts
var MusicApiClient = class {
	withUrl(playlist) {
		return {
			...playlist,
			url: assetUrl(playlist.src),
			thumb_url: playlist.thumb_src ? assetUrl(playlist.thumb_src) : null,
			tracks: playlist.tracks.map((t) => ({
				...t,
				url: assetUrl(t.src)
			}))
		};
	}
	async fetchPlaylistCategories() {
		return apiClient.get("/music/playlist/categories");
	}
	async fetchPlaylists() {
		return (await apiClient.get("/music/playlist")).map((p) => this.withUrl(p));
	}
	async fetchPlaylist(id) {
		const playlist = await apiClient.get(`/music/playlist/${id}`);
		return this.withUrl(playlist);
	}
};
var musicApiClient = new MusicApiClient();
//#endregion
//#region src/lib/engines/musicEngine.ts
var FADE_IN = 3;
var FADE_OUT = 3;
var FADE_VOLUME = .1;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var MusicEngine = class {
	/**
	* Shared gain node that persists across track changes within a playlist.
	* All track players route through this node, so fading it affects the
	* whole playlist without touching individual players. Lazy-initialised
	* on first use, disposed only on reset().
	*/
	masterGain = null;
	/** The currently playing Tone.Player. Swapped on every track change. */
	player = null;
	/** The active playlist. Null when no music is playing. */
	playlist = null;
	/** Index into playlist.tracks pointing at the current or next track to play. */
	trackIndex = 0;
	/** Target gain for the current playlist. Set on setPlaylist, used by fadeInMaster. */
	targetVolume = .5;
	/**
	* Incremented every time setPlaylist or reset is called. Each async
	* operation captures the generation at the time it starts and checks
	* it before proceeding — if the value has changed, a newer call has
	* superseded this one and the operation returns early.
	*/
	generation = 0;
	/**
	* Switches to the given playlist, or stops music if id is null.
	*
	* If a playlist is currently playing, masterGain fades to 0 first and
	* we wait for the fade to complete before starting the new one — a
	* sequential fade, not a crossfade. If setPlaylist is called again
	* during this wait, the generation check exits early and the newer
	* call takes over.
	*
	* @param id     - Playlist id to start, or null to stop music.
	* @param volume - Target gain for the fade-in (0–1). Defaults to 0.5.
	*/
	async setPlaylist(id, volume = .5) {
		this.targetVolume = volume;
		const gen = ++this.generation;
		if (this.playlist && this.masterGain) {
			await this.fadeOutCurrent();
			if (gen !== this.generation) return;
		}
		this.stopPlayer();
		this.playlist = null;
		this.trackIndex = 0;
		if (id === null) return;
		const playlist = await musicApiClient.fetchPlaylist(id);
		if (gen !== this.generation) return;
		this.playlist = playlist;
		await this.playTrack(gen, true);
	}
	/**
	* Fades masterGain to the given volume. No-ops if no playlist is active.
	*
	* @param volume - Target gain value (0–1).
	*/
	setVolume(volume) {
		if (this.masterGain) audioEngine.fadeTo(this.masterGain, volume, FADE_VOLUME);
	}
	/**
	* Immediately stops all playback and disposes masterGain.
	* Increments generation to cancel any in-flight async operations.
	*/
	reset() {
		this.generation++;
		this.stopPlayer();
		if (this.masterGain) {
			this.masterGain.dispose();
			this.masterGain = null;
		}
		this.playlist = null;
		this.trackIndex = 0;
	}
	/**
	* Resets all playback state and restarts from the given playlist id.
	* Call this after audioEngine.reset() has created a fresh AudioContext.
	*
	* @param playlistId - Playlist to restart, or null to leave music silent.
	*/
	async hardReset(playlistId) {
		this.reset();
		await this.setPlaylist(playlistId);
	}
	/**
	* Loads and starts the track at the current trackIndex. Orchestrates
	* stem loading, audio routing, advance registration, and fade-in.
	*
	* @param gen    - Generation value at call time; guards against superseded calls.
	* @param fadeIn - Whether to fade masterGain in on start. False for auto-advance
	*                 since masterGain is already at the right level.
	*/
	async playTrack(gen, fadeIn) {
		if (!this.playlist) return;
		const track = this.playlist.tracks[this.trackIndex];
		const stem = await audioEngine.createStem(track.url);
		if (gen !== this.generation) {
			stem.player.dispose();
			stem.gain.dispose();
			return;
		}
		const masterGain = this.getOrCreateMasterGain();
		const player = this.wireStemToMaster(stem, masterGain);
		this.player = player;
		this.registerAdvance(gen, player);
		player.start();
		if (fadeIn) this.fadeInMaster();
	}
	/**
	* Fades masterGain to 0 and waits for the fade to complete.
	* The caller is responsible for checking generation afterwards.
	*/
	async fadeOutCurrent() {
		audioEngine.fadeTo(this.masterGain, 0, FADE_OUT);
		await sleep(FADE_OUT * 1e3);
	}
	/**
	* Fades masterGain in to the target volume set by the most recent setPlaylist call.
	*/
	fadeInMaster() {
		audioEngine.fadeTo(this.masterGain, this.targetVolume, FADE_IN);
	}
	/**
	* Returns the existing masterGain, or creates and connects a new one at gain 0.
	* If the stored masterGain is on a stale AudioContext (e.g. a reset happened
	* between the context closing and musicEngine.reset() nulling this field),
	* it is disposed and replaced with a fresh node on the current context.
	*/
	getOrCreateMasterGain() {
		if (this.masterGain && this.masterGain.context !== Tone.getContext()) {
			this.masterGain.dispose();
			this.masterGain = null;
		}
		if (!this.masterGain) this.masterGain = new Tone.Gain(0).toDestination();
		return this.masterGain;
	}
	/**
	* Disposes the stem's own gain node and rewires the player directly
	* to masterGain, making masterGain the single volume control for all
	* tracks in the playlist.
	*
	* @param stem       - The stem returned by audioEngine.createStem.
	* @param masterGain - The shared gain node to connect the player to.
	* @returns The player, now routed through masterGain.
	*/
	wireStemToMaster(stem, masterGain) {
		stem.gain.dispose();
		stem.player.disconnect();
		stem.player.connect(masterGain);
		return stem.player;
	}
	/**
	* Registers an onstop callback on the player that advances to the next track
	* when the buffer ends naturally.
	*
	* onstop fires on both natural buffer end and explicit stop() calls. The guard
	* `this.player !== player` distinguishes them: stopPlayer() sets this.player = null
	* before calling stop(), so the callback no-ops on explicit stops.
	*
	* @param gen    - Generation at the time the player was created.
	* @param player - The player to register the callback on.
	*/
	registerAdvance(gen, player) {
		player.onstop = () => {
			if (gen !== this.generation || !this.playlist || this.player !== player) return;
			this.player = null;
			player.dispose();
			this.trackIndex = (this.trackIndex + 1) % this.playlist.tracks.length;
			this.playTrack(gen, false);
		};
	}
	/**
	* Disposes the current player and clears the reference.
	* Sets this.player = null before calling stop() so that the onstop callback
	* knows to no-op when it fires as a result of the explicit stop.
	* Does not touch masterGain — volume state is preserved across track changes.
	*/
	stopPlayer() {
		if (this.player) {
			const player = this.player;
			this.player = null;
			try {
				player.stop();
			} catch {}
			player.dispose();
		}
	}
};
var musicEngine = new MusicEngine();
//#endregion
//#region src/lib/services/sceneApiClient.ts
function resolveScene(scene) {
	const bg = scene.background;
	return {
		...scene,
		background: {
			...bg,
			url: bg.src ? assetUrl(bg.src) : void 0,
			thumb_url: bg.thumb_src ? assetUrl(bg.thumb_src) : null
		},
		layers: scene.layers.map((l) => ({
			...l,
			url: assetUrl(l.src)
		}))
	};
}
var SceneApiClient = class {
	/**
	* @returns All scene categories with their scene entries.
	*/
	async fetchSceneCategories() {
		return apiClient.get("/scene/categories");
	}
	/**
	* @returns All scenes with their backgrounds and layers.
	*/
	async fetchScenes() {
		return (await apiClient.get("/scene")).map(resolveScene);
	}
	/**
	* @returns A single scene by id.
	*/
	async fetchScene(id) {
		return resolveScene(await apiClient.get(`/scene/${id}`));
	}
};
var sceneApiClient = new SceneApiClient();
//#endregion
export { guardedAwait as i, musicEngine as n, ambienceEngine as r, sceneApiClient as t };
