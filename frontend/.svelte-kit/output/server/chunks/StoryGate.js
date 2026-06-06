import { $ as attr, a as attr_class, d as ensure_array_like, o as attr_style, r as tick, tt as escape_html } from "./index-server.js";
import { i as guardedAwait, t as sceneApiClient } from "./sceneApiClient.js";
import { gsap } from "gsap";
//#region src/lib/engines/sceneEngine.ts
var TRANSITION_DUDRATION = 4;
var PARALLAX_LAYER_INCREASE = .1;
var SceneEngine = class {
	/**
	* A token to cancel in-progress transition checkpoints when a new scene
	* is selected before the current transition completes.
	*/
	transitionToken = null;
	/**
	* Run the full transition pipeline: fetch, preload, fade out, swap
	* slots, fade in. Guards are checked between each async step so a
	* newer scene selection cancels the pipeline cleanly.
	*
	* @param token - The transition token for this scene selection.
	* @param sceneId - The id of the scene to transition to.
	* @param getCurrent - Getter for the current scene container, read live at
	*   each usage point so it reflects the DOM state after slot swaps.
	*/
	async transitionScene(sceneId, getCurrent, state) {
		const token = this.createToken();
		try {
			const config = await guardedAwait(this.fetchNextScene(sceneId, state), token);
			await guardedAwait(this.preload(config), token);
			await guardedAwait(this.transitionOut(getCurrent()), token);
			await guardedAwait(this.swapSceneSlots(state), token);
			await this.transitionIn(getCurrent());
		} catch (exception) {
			if (exception instanceof DOMException && exception.name === "AbortError") return;
			throw exception;
		}
	}
	/**
	* Cancel any in-progress transition and create a new token for the
	* current transition. Each call to setScene gets its own token so
	* guards check against the correct transition.
	*
	* @returns A fresh AbortController for the new transition.
	*/
	createToken() {
		this.transitionToken?.abort();
		const token = new AbortController();
		this.transitionToken = token;
		return token;
	}
	/**
	* Check whether the current transition has been superseded by a newer
	* scene selection. Throws an AbortError if so, which is caught and
	* silently swallowed in transitionScene.
	*
	* Fetch the full scene config from the backend and stage it as the
	* next scene in sceneState.
	*
	* @param sceneId - The id of the scene to fetch.
	* @returns The fetched Scene.
	*/
	async fetchNextScene(sceneId, state) {
		state.isTransitioning = true;
		const config = await sceneApiClient.fetchScene(sceneId);
		state.next = config;
		return config;
	}
	/**
	* Preload all media assets in the incoming scene so they are ready
	* before the transition begins. Errors are swallowed per asset so a
	* single missing file does not block the transition.
	*
	* @param config - The scene config whose assets should be preloaded.
	*/
	async preload(config) {
		const sources = [config.background.url, ...config.layers.map((l) => l.url)];
		await Promise.all(sources.map((source) => this.preloadAsset(source)));
	}
	/**
	* Route a single asset source to the appropriate preload method based
	* on its file extension.
	*
	* @param source - The asset URL to preload.
	* @returns A promise that resolves when the asset is ready.
	*/
	preloadAsset(source) {
		return source.endsWith(".webm") || source.endsWith(".mp4") ? this.preloadVideo(source) : this.preloadImage(source);
	}
	/**
	* Preload a video asset by creating an off-screen video element and
	* waiting for it to be ready to play.
	*
	* @param src - The video URL to preload.
	* @returns A promise that resolves when the video can play through.
	*/
	preloadVideo(src) {
		return new Promise((resolve) => {
			const video = document.createElement("video");
			video.src = src;
			video.oncanplaythrough = () => resolve();
			video.onerror = () => resolve();
			video.load();
		});
	}
	/**
	* Preload an image asset by creating an off-screen Image element and
	* waiting for it to load.
	*
	* @param src - The image URL to preload.
	* @returns A promise that resolves when the image has loaded.
	*/
	preloadImage(src) {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = src;
			img.onload = () => resolve();
			img.onerror = () => resolve();
		});
	}
	/**
	* Fade out the outgoing scene container. No-ops if the container is null,
	* e.g. when transitioning from no scene.
	*
	* @param container - The container to fade out.
	*/
	async transitionOut(container) {
		if (!container) return;
		await this.fadeOut(container);
	}
	/**
	* Fade out the given container from its current opacity to zero.
	* Duration scales with the current opacity so mid-fade interrupts finish
	* proportionally rather than always running the full duration.
	*
	* @param container - The container to fade out.
	*/
	async fadeOut(container) {
		gsap.killTweensOf(container);
		const fromOpacity = gsap.getProperty(container, "opacity");
		await gsap.to(container, {
			opacity: 0,
			duration: TRANSITION_DUDRATION * fromOpacity,
			ease: "power1.out"
		});
	}
	/**
	* Fade in the incoming scene container with a parallax zoom-out per layer.
	* Receives the current container after the slot swap, which now holds the
	* incoming scene. No-ops if the container is null.
	*
	* @param container - The container to fade in.
	*/
	async transitionIn(container) {
		if (!container) return;
		this.fadeIn(container);
		this.parallaxZoomOut(container);
	}
	/**
	* Fade in the given container from opacity 0 to 1. Kills any in-progress
	* fade first so rapid scene switches don't stack tweens. Fire-and-forget —
	* called without await from transitionIn.
	*
	* @param container - The container to fade in.
	*/
	async fadeIn(container) {
		gsap.killTweensOf(container);
		gsap.fromTo(container, { opacity: 0 }, {
			opacity: 1,
			duration: TRANSITION_DUDRATION,
			ease: "power1.in"
		});
	}
	/**
	* Animate each layer in the given container from its parallax start scale
	* back to natural scale. Layers at higher z-index start at a larger scale
	* so they appear to move faster, creating a depth effect. Kills any
	* in-progress tween per element so re-selecting a scene always replays
	* from the correct starting scale.
	*
	* @param container - The container whose `.fill` children are animated.
	*/
	parallaxZoomOut(container) {
		container.querySelectorAll(".fill").forEach((element) => {
			gsap.killTweensOf(element);
			const scale = 1 + (1 + Number(element.style.zIndex)) * PARALLAX_LAYER_INCREASE;
			const duration = Math.min(TRANSITION_DUDRATION * .5, 2);
			gsap.fromTo(element, { scale }, {
				scale: 1,
				duration,
				ease: "power1.out"
			});
		});
	}
	/**
	* Promote the next scene to current, clear the next slot, and wait
	* for Svelte to update the DOM before continuing.
	*/
	async swapSceneSlots(state) {
		state.current = state.next;
		state.next = null;
		state.isTransitioning = false;
		await tick();
	}
};
new SceneEngine();
//#endregion
//#region src/lib/components/scene/SceneAsset.svelte
function SceneAsset($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { asset, zIndex } = $$props;
		/**
		* Generate a css filter string based on config.
		*/
		function cssFilter() {
			const f = [];
			if (asset.brightness !== 1) f.push(`brightness(${asset.brightness})`);
			if (asset.grayscale !== 0) f.push(`grayscale(${asset.grayscale})`);
			if (asset.blur !== 0) f.push(`blur(${asset.blur}px)`);
			return f.length ? f.join(" ") : "none";
		}
		if (asset.type === "image") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fill svelte-lqcvav"${attr_style("", {
				"z-index": zIndex,
				"mix-blend-mode": asset.blend_mode
			})}><img class="media svelte-lqcvav"${attr("src", asset.url)} alt="" aria-hidden="true"${attr_style("", {
				opacity: asset.opacity,
				filter: cssFilter(),
				transform: asset.flip ? "scaleX(-1)" : "none"
			})}/></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="fill svelte-lqcvav"${attr_style("", {
				"z-index": zIndex,
				"mix-blend-mode": asset.blend_mode
			})}><video class="media svelte-lqcvav"${attr("src", asset.url)} autoplay=""${attr("loop", asset.loop, true)} muted="" playsinline=""${attr_style("", {
				opacity: asset.opacity,
				filter: cssFilter(),
				transform: asset.flip ? "scaleX(-1)" : "none"
			})}></video></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/lib/components/scene/SceneRenderer.svelte
function SceneRenderer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { slotState } = $$props;
		/**
		* Return the scene's layers sorted ascending by order so higher-order
		* layers render on top. Returns an empty array if config is falsy.
		*
		* @param config - The scene config whose layers should be sorted.
		*/
		function sortedLayers(config) {
			return config ? [...config.layers].sort((a, b) => a.order - b.order) : [];
		}
		if (slotState.current) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="scene-slot svelte-yhy3x4">`);
			SceneAsset($$renderer, {
				asset: slotState.current.background,
				zIndex: 0
			});
			$$renderer.push(`<!----> <!--[-->`);
			const each_array = ensure_array_like(sortedLayers(slotState.current));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let layer = each_array[$$index];
				SceneAsset($$renderer, {
					asset: layer,
					zIndex: layer.order + 1
				});
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/lib/components/scene/StoryGate.svelte
function StoryGate($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { onunlock, title } = $$props;
		$$renderer.push(`<div${attr_class("gate svelte-iuy55d", void 0, { "fading": false })} role="button" tabindex="0"><div class="content svelte-iuy55d"><h1 class="title svelte-iuy55d">${escape_html(title)}</h1> <span class="prompt svelte-iuy55d">Click to begin</span></div></div>`);
	});
}
//#endregion
export { SceneRenderer as n, StoryGate as t };
