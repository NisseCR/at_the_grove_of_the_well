import { $ as attr, a as attr_class, c as bind_props, d as ensure_array_like, h as stringify, l as derived, m as spread_props, o as attr_style, tt as escape_html } from "../../../chunks/index-server.js";
import { t as page } from "../../../chunks/state.js";
import { a as appState, i as sceneState, n as Volume_2, r as Icon, t as Volume_x } from "../../../chunks/volume-x.js";
import { r as WS_BASE } from "../../../chunks/apiClient.js";
import { n as musicEngine, r as ambienceEngine } from "../../../chunks/sceneApiClient.js";
//#region src/lib/services/messageHandler.ts
async function handleMessage(message) {
	switch (message.type) {
		case "SET_SCENE": {
			const { sceneId, label } = message.payload;
			appState.scene = {
				id: sceneId,
				label
			};
			if (page.url.pathname === "/player") sceneState.requestedSceneId = sceneId;
			break;
		}
		case "SET_AMBIENCES": {
			const { ambiences } = message.payload;
			appState.ambiences = ambiences;
			if (page.url.pathname === "/player" && appState.renderReady) await ambienceEngine.syncActive(ambiences);
			break;
		}
		case "SET_AMBIENCE_VOLUME": {
			const { id, volume } = message.payload;
			if (appState.ambiences) {
				const entry = appState.ambiences.find((a) => a.id === id);
				if (entry) entry.volume = volume;
			}
			if (page.url.pathname === "/player" && appState.renderReady) ambienceEngine.setVolume(id, volume);
			break;
		}
		case "SET_PLAYLIST": {
			const { id, label } = message.payload;
			appState.music = {
				id,
				label,
				volume: appState.music?.volume ?? .5
			};
			if (page.url.pathname === "/player" && appState.renderReady) await musicEngine.setPlaylist(id);
			break;
		}
		case "SET_MUSIC_VOLUME":
			if (!appState.music) appState.music = {
				id: null,
				label: null,
				volume: message.payload.volume
			};
			else appState.music.volume = message.payload.volume;
			if (page.url.pathname === "/player" && appState.renderReady) musicEngine.setVolume(message.payload.volume);
			break;
		case "RESET_AUDIO":
			if (page.url.pathname === "/player" && appState.renderReady) {
				await ambienceEngine.hardReset(appState.ambiences ?? []);
				await musicEngine.hardReset(appState.music?.id ?? null);
			}
			break;
		case "SET_DEBUG":
			appState.debug = message.payload.debug;
			break;
		case "CLIENT_CONNECTED":
			if (page.url.pathname === "/controller") sendSync();
			break;
		case "SYNC": {
			const { scene, ambiences, music } = message.payload;
			appState.scene = scene ? {
				id: scene.id,
				label: null
			} : null;
			appState.ambiences = ambiences ?? null;
			appState.music = music ? {
				...music,
				label: music.label ?? null
			} : null;
			if (page.url.pathname === "/player" && appState.renderReady) {
				if (scene) sceneState.requestedSceneId = scene.id;
				await ambienceEngine.syncActive(ambiences ?? []);
				await musicEngine.setPlaylist(music?.id ?? null);
				if (music) musicEngine.setVolume(music.volume);
			}
			break;
		}
	}
}
//#endregion
//#region src/lib/services/transport.ts
var WEBSOCKET_URL = `${WS_BASE}/api/control/ws`;
var RECONNECT_DELAY = 3e3;
var websocket = null;
function connect() {
	if (websocket?.readyState === WebSocket.OPEN || websocket?.readyState === WebSocket.CONNECTING) return;
	websocket = new WebSocket(WEBSOCKET_URL);
	websocket.onopen = () => {
		appState.socketConnected = true;
		console.log("Socket connected.");
	};
	websocket.onclose = () => {
		appState.socketConnected = false;
		console.log("Socket disconnected, reconnecting...");
		setTimeout(connect, RECONNECT_DELAY);
	};
	websocket.onerror = () => websocket?.close();
	websocket.onmessage = async (event) => {
		await handleMessage(JSON.parse(event.data));
	};
}
connect();
function send(msg) {
	if (websocket?.readyState === WebSocket.OPEN) websocket.send(JSON.stringify(msg));
}
function sendSetScene(sceneId, label = null) {
	send({
		type: "SET_SCENE",
		payload: {
			sceneId,
			label
		}
	});
}
function sendSync() {
	send({
		type: "SYNC",
		payload: {
			scene: appState.scene,
			ambiences: appState.ambiences,
			music: appState.music
		}
	});
}
//#endregion
//#region src/routes/controller/CategoryHeader.svelte
function CategoryHeader($$renderer, $$props) {
	const { label, src } = $$props;
	$$renderer.push(`<h3${attr_class("category-header svelte-xiprka", void 0, { "has-art": !!src })}${attr_style(src ? `--art-src: url('${src}')` : "")}>${escape_html(label)}</h3>`);
}
//#endregion
//#region src/routes/controller/ThumbnailTile.svelte
function ThumbnailTile($$renderer, $$props) {
	const { label, src, active, onclick, aspectRatio = "16 / 10", minWidth = "180px", labelSize = "var(--text-sm)" } = $$props;
	$$renderer.push(`<button${attr_class("tile svelte-1qomeh3", void 0, { "active": active })}${attr_style(`--aspect-ratio: ${stringify(aspectRatio)}; --min-width: ${stringify(minWidth)}; --label-size: ${stringify(labelSize)};`)}>`);
	if (src) {
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="thumbnail svelte-1qomeh3"${attr_style(`background-image: url('${stringify(src)}')`)}></div>`);
	} else {
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<div class="thumbnail placeholder svelte-1qomeh3"></div>`);
	}
	$$renderer.push(`<!--]--> <span class="tile-label svelte-1qomeh3">${escape_html(label)}</span></button>`);
}
//#endregion
//#region src/routes/controller/Scenes.svelte
function Scenes($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let categories = [];
		let scenes = [];
		function thumbnailFor(id) {
			const bg = scenes.find((s) => s.id === id)?.background;
			return bg?.thumb_url ?? bg?.url ?? void 0;
		}
		function isActive(id) {
			return appState.scene?.id === id;
		}
		$$renderer.push(`<div class="categories svelte-q2jsei"><!--[-->`);
		const each_array = ensure_array_like(categories);
		for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
			let category = each_array[$$index_1];
			$$renderer.push(`<div class="category">`);
			CategoryHeader($$renderer, { label: category.label });
			$$renderer.push(`<!----> <div class="grid svelte-q2jsei"><!--[-->`);
			const each_array_1 = ensure_array_like(category.scenes);
			for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
				let entry = each_array_1[$$index];
				ThumbnailTile($$renderer, {
					label: entry.label,
					src: thumbnailFor(entry.id),
					active: isActive(entry.id),
					onclick: () => sendSetScene(entry.id, entry.label)
				});
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/audio-lines.svelte
function Audio_lines($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "audio-lines" },
		props,
		{ iconNode: [
			["path", { "d": "M2 10v3" }],
			["path", { "d": "M6 6v11" }],
			["path", { "d": "M10 3v18" }],
			["path", { "d": "M14 8v7" }],
			["path", { "d": "M18 5v13" }],
			["path", { "d": "M22 10v3" }]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/music.svelte
function Music($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "music" },
		props,
		{ iconNode: [
			["path", { "d": "M9 18V5l12-2v13" }],
			["circle", {
				"cx": "6",
				"cy": "18",
				"r": "3"
			}],
			["circle", {
				"cx": "18",
				"cy": "16",
				"r": "3"
			}]
		] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/rotate-ccw.svelte
function Rotate_ccw($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "rotate-ccw" },
		props,
		{ iconNode: [["path", { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { "d": "M3 3v5h5" }]] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/volume-1.svelte
function Volume_1($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "volume-1" },
		props,
		{ iconNode: [["path", { "d": "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }], ["path", { "d": "M16 9a5 5 0 0 1 0 6" }]] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/volume.svelte
function Volume($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "volume" },
		props,
		{ iconNode: [["path", { "d": "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }]] }
	]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/x.svelte
function X($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "x" },
		props,
		{ iconNode: [["path", { "d": "M18 6 6 18" }], ["path", { "d": "m6 6 12 12" }]] }
	]));
}
//#endregion
//#region src/routes/controller/MusicRow.svelte
function MusicRow($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		function volumeIcon(v) {
			if (v === 0) return Volume_x;
			if (v < .35) return Volume;
			if (v < .65) return Volume_1;
			return Volume_2;
		}
		const volume = derived(() => appState.music.volume);
		const VolumeIcon = derived(() => volumeIcon(volume()));
		$$renderer.push(`<div class="row svelte-wog706"><div class="row-header svelte-wog706">`);
		Music($$renderer, {
			class: "icon name-icon",
			size: 13
		});
		$$renderer.push(`<!----> <span class="audio-name svelte-wog706">${escape_html(appState.music.label ?? appState.music.id)}</span> <button class="dismiss svelte-wog706" aria-label="Stop music">`);
		X($$renderer, { size: 16 });
		$$renderer.push(`<!----></button></div> <div class="volume-row svelte-wog706">`);
		if (VolumeIcon()) {
			$$renderer.push("<!--[-->");
			VolumeIcon()($$renderer, {
				class: "icon vol-icon",
				size: 13
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		$$renderer.push(` <input class="volume-slider svelte-wog706" type="range" min="0" max="1" step="0.01"${attr("value", volume())}/></div></div>`);
	});
}
//#endregion
//#region src/routes/controller/AmbienceRow.svelte
function AmbienceRow($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { ambience } = $$props;
		function volumeIcon(v) {
			if (v === 0) return Volume_x;
			if (v < .35) return Volume;
			if (v < .65) return Volume_1;
			return Volume_2;
		}
		const VolumeIcon = derived(() => volumeIcon(ambience.volume));
		$$renderer.push(`<div class="row svelte-1o8r6zv"><div class="row-header svelte-1o8r6zv">`);
		Audio_lines($$renderer, {
			class: "icon name-icon",
			size: 13
		});
		$$renderer.push(`<!----> <span class="audio-name svelte-1o8r6zv">${escape_html(ambience.label ?? ambience.id)}</span> <button class="dismiss svelte-1o8r6zv"${attr("aria-label", `Remove ${stringify(ambience.label ?? ambience.id)}`)}>`);
		X($$renderer, { size: 16 });
		$$renderer.push(`<!----></button></div> <div class="volume-row svelte-1o8r6zv">`);
		if (VolumeIcon()) {
			$$renderer.push("<!--[-->");
			VolumeIcon()($$renderer, {
				class: "icon vol-icon",
				size: 13
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		$$renderer.push(` <input class="volume-slider svelte-1o8r6zv" type="range" min="0" max="1" step="0.01"${attr("value", ambience.volume)}/></div></div>`);
	});
}
//#endregion
//#region src/routes/controller/AudioPanel.svelte
function AudioPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { collapsed = false } = $$props;
		const hasMusic = derived(() => appState.music?.id != null);
		const hasAmbiences = derived(() => (appState.ambiences?.length ?? 0) > 0);
		$$renderer.push(`<aside${attr_class("audio-panel svelte-qlc3gn", void 0, { "collapsed": collapsed })}><div class="panel-header svelte-qlc3gn"><h2 class="panel-title svelte-qlc3gn">Audio</h2> <button class="reset-btn svelte-qlc3gn" aria-label="Reset audio">`);
		Rotate_ccw($$renderer, { size: 13 });
		$$renderer.push(`<!----></button></div> <div class="panel-body svelte-qlc3gn">`);
		if (hasMusic()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<section class="section svelte-qlc3gn"><span class="section-label svelte-qlc3gn">Music</span> `);
			MusicRow($$renderer, {});
			$$renderer.push(`<!----></section>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (hasAmbiences()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<section class="section svelte-qlc3gn"><span class="section-label svelte-qlc3gn">Ambiences</span> <!--[-->`);
			const each_array = ensure_array_like(appState.ambiences);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let ambience = each_array[$$index];
				AmbienceRow($$renderer, { ambience });
			}
			$$renderer.push(`<!--]--></section>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (!hasMusic() && !hasAmbiences()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<p class="empty svelte-qlc3gn">Nothing active</p>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></aside>`);
		bind_props($$props, { collapsed });
	});
}
//#endregion
//#region src/routes/controller/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const projectName = "At the Grove of the Well";
		let panelCollapsed = true;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="controller svelte-c6l141"><div class="bg svelte-c6l141"></div> <nav class="tabs svelte-c6l141"><div class="tabs-inner svelte-c6l141"><h1 class="project-title svelte-c6l141">${escape_html(projectName)}</h1> <div class="tab-row svelte-c6l141"><button${attr_class("tab svelte-c6l141", void 0, { "active": true })}>Scenes</button> <button${attr_class("tab svelte-c6l141", void 0, { "active": false })}>Music</button> <button${attr_class("tab svelte-c6l141", void 0, { "active": false })}>Ambiences</button> <button${attr_class("tab svelte-c6l141", void 0, { "active": false })}>Config</button> <button${attr_class("tab audio-toggle svelte-c6l141", void 0, { "active": !panelCollapsed })} aria-label="Toggle audio panel">`);
			Audio_lines($$renderer, { size: 15 });
			$$renderer.push(`<!----></button></div></div></nav> <div class="main svelte-c6l141"><div class="content svelte-c6l141">`);
			$$renderer.push("<!--[0-->");
			Scenes($$renderer, {});
			$$renderer.push(`<!--]--></div> `);
			if (!panelCollapsed) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="panel-backdrop svelte-c6l141" aria-label="Close audio panel"></button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			AudioPanel($$renderer, {
				get collapsed() {
					return panelCollapsed;
				},
				set collapsed($$value) {
					panelCollapsed = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
export { _page as default };
