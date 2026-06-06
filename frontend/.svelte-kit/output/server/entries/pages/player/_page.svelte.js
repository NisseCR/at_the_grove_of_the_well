import { $ as attr, a as attr_class, c as bind_props, d as ensure_array_like, f as props_id, ft as run, ht as setContext, l as derived, mt as hasContext, n as onDestroy, nt as ATTACHMENT_KEY, pt as getContext, s as attributes, tt as escape_html } from "../../../chunks/index-server.js";
import { r as on } from "../../../chunks/events.js";
import "../../../chunks/legacy-client.js";
import { t as createSubscriber } from "../../../chunks/index-server2.js";
import { a as appState, i as sceneState, n as Volume_2, t as Volume_x } from "../../../chunks/volume-x.js";
import { n as musicEngine, r as ambienceEngine } from "../../../chunks/sceneApiClient.js";
import { n as SceneRenderer, t as StoryGate } from "../../../chunks/StoryGate.js";
import { clsx } from "clsx";
import * as Tone from "tone";
import parse from "style-to-object";
//#region src/routes/player/DebugOverlay.svelte
function DebugOverlay($$renderer) {
	$$renderer.push(`<div class="debug svelte-1isy4qx"><section class="svelte-1isy4qx"><h4 class="svelte-1isy4qx">appState</h4> <pre class="svelte-1isy4qx">${escape_html(JSON.stringify(appState, null, 2))}</pre></section> <section class="svelte-1isy4qx"><h4 class="svelte-1isy4qx">sceneState</h4> <pre class="svelte-1isy4qx">${escape_html(JSON.stringify(sceneState, null, 2))}</pre></section></div>`);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/is.js
function isObject(value) {
	return value !== null && typeof value === "object";
}
var CLASS_VALUE_PRIMITIVE_TYPES = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function isClassValue(value) {
	if (value === null || value === void 0) return true;
	if (CLASS_VALUE_PRIMITIVE_TYPES.includes(typeof value)) return true;
	if (Array.isArray(value)) return value.every((item) => isClassValue(item));
	if (typeof value === "object") {
		if (Object.getPrototypeOf(value) !== Object.prototype) return false;
		return true;
	}
	return false;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/box/box-extras.svelte.js
var BoxSymbol = Symbol("box");
var isWritableSymbol = Symbol("is-writable");
function boxWith(getter, setter) {
	const derived$1 = derived(getter);
	if (setter) return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return derived$1();
		},
		set current(v) {
			setter(v);
		}
	};
	return {
		[BoxSymbol]: true,
		get current() {
			return getter();
		}
	};
}
/**
* @returns Whether the value is a Box
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function isBox(value) {
	return isObject(value) && BoxSymbol in value;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
/**
* Composes event handlers into a single function that can be called with an event.
* If the previous handler cancels the event using `event.preventDefault()`, the handlers
* that follow will not be called.
*/
function composeHandlers(...handlers) {
	return function(e) {
		for (const handler of handlers) {
			if (!handler) continue;
			if (e.defaultPrevented) return;
			if (typeof handler === "function") handler.call(this, e);
			else handler.current?.call(this, e);
		}
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/strings.js
var NUMBER_CHAR_RE = /\d/;
var STR_SPLITTERS = [
	"-",
	"_",
	"/",
	"."
];
function isUppercase(char = "") {
	if (NUMBER_CHAR_RE.test(char)) return void 0;
	return char !== char.toLowerCase();
}
function splitByCase(str) {
	const parts = [];
	let buff = "";
	let previousUpper;
	let previousSplitter;
	for (const char of str) {
		const isSplitter = STR_SPLITTERS.includes(char);
		if (isSplitter === true) {
			parts.push(buff);
			buff = "";
			previousUpper = void 0;
			continue;
		}
		const isUpper = isUppercase(char);
		if (previousSplitter === false) {
			if (previousUpper === false && isUpper === true) {
				parts.push(buff);
				buff = char;
				previousUpper = isUpper;
				continue;
			}
			if (previousUpper === true && isUpper === false && buff.length > 1) {
				const lastChar = buff.at(-1);
				parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
				buff = lastChar + char;
				previousUpper = isUpper;
				continue;
			}
		}
		buff += char;
		previousUpper = isUpper;
		previousSplitter = isSplitter;
	}
	parts.push(buff);
	return parts;
}
function pascalCase(str) {
	if (!str) return "";
	return splitByCase(str).map((p) => upperFirst(p)).join("");
}
function camelCase(str) {
	return lowerFirst(pascalCase(str || ""));
}
function upperFirst(str) {
	return str ? str[0].toUpperCase() + str.slice(1) : "";
}
function lowerFirst(str) {
	return str ? str[0].toLowerCase() + str.slice(1) : "";
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
function cssToStyleObj(css) {
	if (!css) return {};
	const styleObj = {};
	function iterator(name, value) {
		if (name.startsWith("-moz-") || name.startsWith("-webkit-") || name.startsWith("-ms-") || name.startsWith("-o-")) {
			styleObj[pascalCase(name)] = value;
			return;
		}
		if (name.startsWith("--")) {
			styleObj[name] = value;
			return;
		}
		styleObj[camelCase(name)] = value;
	}
	parse(css, iterator);
	return styleObj;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
/**
* Executes an array of callback functions with the same arguments.
* @template T The types of the arguments that the callback functions take.
* @param callbacks array of callback functions to execute.
* @returns A new function that executes all of the original callback functions with the same arguments.
*/
function executeCallbacks(...callbacks) {
	return (...args) => {
		for (const callback of callbacks) if (typeof callback === "function") callback(...args);
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function createParser(matcher, replacer) {
	const regex = RegExp(matcher, "g");
	return (str) => {
		if (typeof str !== "string") throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
		if (!str.match(regex)) return str;
		return str.replace(regex, replacer);
	};
}
var camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
	if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
	return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style.js
function styleToString(style = {}) {
	return styleToCSS(style).replace("\n", " ");
}
var EVENT_LIST_SET = new Set([
	"onabort",
	"onanimationcancel",
	"onanimationend",
	"onanimationiteration",
	"onanimationstart",
	"onauxclick",
	"onbeforeinput",
	"onbeforetoggle",
	"onblur",
	"oncancel",
	"oncanplay",
	"oncanplaythrough",
	"onchange",
	"onclick",
	"onclose",
	"oncompositionend",
	"oncompositionstart",
	"oncompositionupdate",
	"oncontextlost",
	"oncontextmenu",
	"oncontextrestored",
	"oncopy",
	"oncuechange",
	"oncut",
	"ondblclick",
	"ondrag",
	"ondragend",
	"ondragenter",
	"ondragleave",
	"ondragover",
	"ondragstart",
	"ondrop",
	"ondurationchange",
	"onemptied",
	"onended",
	"onerror",
	"onfocus",
	"onfocusin",
	"onfocusout",
	"onformdata",
	"ongotpointercapture",
	"oninput",
	"oninvalid",
	"onkeydown",
	"onkeypress",
	"onkeyup",
	"onload",
	"onloadeddata",
	"onloadedmetadata",
	"onloadstart",
	"onlostpointercapture",
	"onmousedown",
	"onmouseenter",
	"onmouseleave",
	"onmousemove",
	"onmouseout",
	"onmouseover",
	"onmouseup",
	"onpaste",
	"onpause",
	"onplay",
	"onplaying",
	"onpointercancel",
	"onpointerdown",
	"onpointerenter",
	"onpointerleave",
	"onpointermove",
	"onpointerout",
	"onpointerover",
	"onpointerup",
	"onprogress",
	"onratechange",
	"onreset",
	"onresize",
	"onscroll",
	"onscrollend",
	"onsecuritypolicyviolation",
	"onseeked",
	"onseeking",
	"onselect",
	"onselectionchange",
	"onselectstart",
	"onslotchange",
	"onstalled",
	"onsubmit",
	"onsuspend",
	"ontimeupdate",
	"ontoggle",
	"ontouchcancel",
	"ontouchend",
	"ontouchmove",
	"ontouchstart",
	"ontransitioncancel",
	"ontransitionend",
	"ontransitionrun",
	"ontransitionstart",
	"onvolumechange",
	"onwaiting",
	"onwebkitanimationend",
	"onwebkitanimationiteration",
	"onwebkitanimationstart",
	"onwebkittransitionend",
	"onwheel"
]);
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/merge-props.js
/**
* Modified from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/utils/src/mergeProps.ts (see NOTICE.txt for source)
*/
function isEventHandler(key) {
	return EVENT_LIST_SET.has(key);
}
/**
* Given a list of prop objects, merges them into a single object.
* - Automatically composes event handlers (e.g. `onclick`, `oninput`, etc.)
* - Chains regular functions with the same name so they are called in order
* - Merges class strings with `clsx`
* - Merges style objects and converts them to strings
* - Handles a bug with Svelte where setting the `hidden` attribute to `false` doesn't remove it
* - Overrides other values with the last one
*/
function mergeProps(...args) {
	const result = { ...args[0] };
	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		if (!props) continue;
		for (const key of Object.keys(props)) {
			const a = result[key];
			const b = props[key];
			const aIsFunction = typeof a === "function";
			const bIsFunction = typeof b === "function";
			if (aIsFunction && typeof bIsFunction && isEventHandler(key)) result[key] = composeHandlers(a, b);
			else if (aIsFunction && bIsFunction) result[key] = executeCallbacks(a, b);
			else if (key === "class") {
				const aIsClassValue = isClassValue(a);
				const bIsClassValue = isClassValue(b);
				if (aIsClassValue && bIsClassValue) result[key] = clsx(a, b);
				else if (aIsClassValue) result[key] = clsx(a);
				else if (bIsClassValue) result[key] = clsx(b);
			} else if (key === "style") {
				const aIsObject = typeof a === "object";
				const bIsObject = typeof b === "object";
				const aIsString = typeof a === "string";
				const bIsString = typeof b === "string";
				if (aIsObject && bIsObject) result[key] = {
					...a,
					...b
				};
				else if (aIsObject && bIsString) {
					const parsedStyle = cssToStyleObj(b);
					result[key] = {
						...a,
						...parsedStyle
					};
				} else if (aIsString && bIsObject) result[key] = {
					...cssToStyleObj(a),
					...b
				};
				else if (aIsString && bIsString) {
					const parsedStyleA = cssToStyleObj(a);
					const parsedStyleB = cssToStyleObj(b);
					result[key] = {
						...parsedStyleA,
						...parsedStyleB
					};
				} else if (aIsObject) result[key] = a;
				else if (bIsObject) result[key] = b;
				else if (aIsString) result[key] = a;
				else if (bIsString) result[key] = b;
			} else result[key] = b !== void 0 ? b : a;
		}
		for (const key of Object.getOwnPropertySymbols(props)) {
			const a = result[key];
			const b = props[key];
			result[key] = b !== void 0 ? b : a;
		}
	}
	if (typeof result.style === "object") result.style = styleToString(result.style).replaceAll("\n", " ");
	if (result.hidden === false) {
		result.hidden = void 0;
		delete result.hidden;
	}
	if (result.disabled === false) {
		result.disabled = void 0;
		delete result.disabled;
	}
	return result;
}
//#endregion
//#region node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement$1(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
//#endregion
//#region node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber((update) => {
			const cleanupFocusIn = on(window, "focusin", update);
			const cleanupFocusOut = on(window, "focusout", update);
			return () => {
				cleanupFocusIn();
				cleanupFocusOut();
			};
		});
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement$1(this.#document);
	}
};
new ActiveElement();
//#endregion
//#region node_modules/runed/dist/utilities/context/context.js
var Context = class {
	#name;
	#key;
	/**
	* @param name The name of the context.
	* This is used for generating the context key and error messages.
	*/
	constructor(name) {
		this.#name = name;
		this.#key = Symbol(name);
	}
	/**
	* The key used to get and set the context.
	*
	* It is not recommended to use this value directly.
	* Instead, use the methods provided by this class.
	*/
	get key() {
		return this.#key;
	}
	/**
	* Checks whether this has been set in the context of a parent component.
	*
	* Must be called during component initialisation.
	*/
	exists() {
		return hasContext(this.#key);
	}
	/**
	* Retrieves the context that belongs to the closest parent component.
	*
	* Must be called during component initialisation.
	*
	* @throws An error if the context does not exist.
	*/
	get() {
		const context = getContext(this.#key);
		if (context === void 0) throw new Error(`Context "${this.#name}" not found`);
		return context;
	}
	/**
	* Retrieves the context that belongs to the closest parent component,
	* or the given fallback value if the context does not exist.
	*
	* Must be called during component initialisation.
	*/
	getOr(fallback) {
		const context = getContext(this.#key);
		if (context === void 0) return fallback;
		return context;
	}
	/**
	* Associates the given value with the current component and returns it.
	*
	* Must be called during component initialisation.
	*/
	set(context) {
		return setContext(this.#key, context);
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch(sources, effect, options) {
	runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
	runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
function watchOnce(source, effect) {}
function watchOncePre(source, effect) {}
watchOnce.pre = watchOncePre;
//#endregion
//#region node_modules/runed/dist/utilities/resource/resource.svelte.js
function debounce(fn, delay) {
	let timeoutId;
	let lastResolve = null;
	return (...args) => {
		return new Promise((resolve) => {
			if (lastResolve) lastResolve(void 0);
			lastResolve = resolve;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(async () => {
				const result = await fn(...args);
				if (lastResolve) {
					lastResolve(result);
					lastResolve = null;
				}
			}, delay);
		});
	};
}
function throttle(fn, delay) {
	let lastRun = 0;
	let lastPromise = null;
	return (...args) => {
		const now = Date.now();
		if (lastRun && now - lastRun < delay) return lastPromise ?? Promise.resolve(void 0);
		lastRun = now;
		lastPromise = fn(...args);
		return lastPromise;
	};
}
function runResource(source, fetcher, options = {}, effectFn) {
	const { lazy = false, once = false, initialValue, debounce: debounceTime, throttle: throttleTime } = options;
	let current = initialValue;
	let loading = false;
	let error = void 0;
	let cleanupFns = [];
	const runCleanup = () => {
		cleanupFns.forEach((fn) => fn());
		cleanupFns = [];
	};
	const onCleanup = (fn) => {
		cleanupFns = [...cleanupFns, fn];
	};
	const baseFetcher = async (value, previousValue, refetching = false) => {
		try {
			loading = true;
			error = void 0;
			runCleanup();
			const controller = new AbortController();
			onCleanup(() => controller.abort());
			const result = await fetcher(value, previousValue, {
				data: current,
				refetching,
				onCleanup,
				signal: controller.signal
			});
			current = result;
			return result;
		} catch (e) {
			if (!(e instanceof DOMException && e.name === "AbortError")) error = e;
			return;
		} finally {
			loading = false;
		}
	};
	const runFetcher = debounceTime ? debounce(baseFetcher, debounceTime) : throttleTime ? throttle(baseFetcher, throttleTime) : baseFetcher;
	const sources = Array.isArray(source) ? source : [source];
	let prevValues;
	effectFn((values, previousValues) => {
		if (once && prevValues) return;
		prevValues = values;
		runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? previousValues : previousValues?.[0]);
	}, { lazy });
	return {
		get current() {
			return current;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		mutate: (value) => {
			current = value;
		},
		refetch: (info) => {
			const values = sources.map((s) => s());
			return runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? values : values[0], info ?? true);
		}
	};
}
function resource(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getters = () => sources.map((s) => s());
		watch(getters, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
function resourcePre(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getter = () => sources.map((s) => s());
		watch.pre(getter, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
resource.pre = resourcePre;
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom.js
var DOCUMENT_NODE = 9;
function isDocument(node) {
	return isObject(node) && node.nodeType === DOCUMENT_NODE;
}
function isWindow(node) {
	return isObject(node) && node.constructor?.name === "VisualViewport";
}
function getDocument(node) {
	if (isDocument(node)) return node;
	if (isWindow(node)) return node.document;
	return node?.ownerDocument ?? document;
}
function getActiveElement(rootNode) {
	let activeElement = rootNode.activeElement;
	while (activeElement?.shadowRoot) {
		const el = activeElement.shadowRoot.activeElement;
		if (el === activeElement) break;
		else activeElement = el;
	}
	return activeElement;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var DOMContext = class {
	element;
	#root = derived(() => {
		if (!this.element.current) return document;
		return this.element.current.getRootNode() ?? document;
	});
	get root() {
		return this.#root();
	}
	set root($$value) {
		return this.#root($$value);
	}
	constructor(element) {
		if (typeof element === "function") this.element = boxWith(element);
		else this.element = element;
	}
	getDocument = () => {
		return getDocument(this.root);
	};
	getWindow = () => {
		return this.getDocument().defaultView ?? window;
	};
	getActiveElement = () => {
		return getActiveElement(this.root);
	};
	isActiveElement = (node) => {
		return node === this.getActiveElement();
	};
	getElementById(id) {
		return this.root.getElementById(id);
	}
	querySelector = (selector) => {
		if (!this.root) return null;
		return this.root.querySelector(selector);
	};
	querySelectorAll = (selector) => {
		if (!this.root) return [];
		return this.root.querySelectorAll(selector);
	};
	setTimeout = (callback, delay) => {
		return this.getWindow().setTimeout(callback, delay);
	};
	clearTimeout = (timeoutId) => {
		return this.getWindow().clearTimeout(timeoutId);
	};
};
if (typeof HTMLElement === "function");
//#endregion
//#region node_modules/svelte/src/attachments/index.js
/**
* Creates an object key that will be recognised as an attachment when the object is spread onto an element,
* as a programmatic alternative to using `{@attach ...}`. This can be useful for library authors, though
* is generally not needed when building an app.
*
* ```svelte
* <script>
* 	import { createAttachmentKey } from 'svelte/attachments';
*
* 	const props = {
* 		class: 'cool',
* 		onclick: () => alert('clicked'),
* 		[createAttachmentKey()]: (node) => {
* 			node.textContent = 'attached!';
* 		}
* 	};
* <\/script>
*
* <button {...props}>click me</button>
* ```
* @since 5.29
*/
function createAttachmentKey() {
	return Symbol(ATTACHMENT_KEY);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/attach-ref.js
/**
* Creates a Svelte Attachment that attaches a DOM element to a ref.
* The ref can be either a WritableBox or a callback function.
*
* @param ref - Either a WritableBox to store the element in, or a callback function that receives the element
* @param onChange - Optional callback that fires when the ref changes
* @returns An object with a spreadable attachment key that should be spread onto the element
*
* @example
* // Using with WritableBox
* const ref = box<HTMLDivElement | null>(null);
* <div {...attachRef(ref)}>Content</div>
*
* @example
* // Using with callback
* <div {...attachRef((node) => myNode = node)}>Content</div>
*
* @example
* // Using with onChange
* <div {...attachRef(ref, (node) => console.log(node))}>Content</div>
*/
function attachRef(ref, onChange) {
	return { [createAttachmentKey()]: (node) => {
		if (isBox(ref)) {
			ref.current = node;
			run(() => onChange?.(node));
			return () => {
				if ("isConnected" in node && node.isConnected) return;
				ref.current = null;
				onChange?.(null);
			};
		}
		ref(node);
		run(() => onChange?.(node));
		return () => {
			if ("isConnected" in node && node.isConnected) return;
			ref(null);
			onChange?.(null);
		};
	} };
}
//#endregion
//#region node_modules/bits-ui/dist/internal/attrs.js
function boolToStr(condition) {
	return condition ? "true" : "false";
}
function boolToEmptyStrOrUndef(condition) {
	return condition ? "" : void 0;
}
var BitsAttrs = class {
	#variant;
	#prefix;
	attrs;
	constructor(config) {
		this.#variant = config.getVariant ? config.getVariant() : null;
		this.#prefix = this.#variant ? `data-${this.#variant}-` : `data-${config.component}-`;
		this.getAttr = this.getAttr.bind(this);
		this.selector = this.selector.bind(this);
		this.attrs = Object.fromEntries(config.parts.map((part) => [part, this.getAttr(part)]));
	}
	getAttr(part, variantOverride) {
		if (variantOverride) return `data-${variantOverride}-${part}`;
		return `${this.#prefix}${part}`;
	}
	selector(part, variantOverride) {
		return `[${this.getAttr(part, variantOverride)}]`;
	}
};
function createBitsAttrs(config) {
	const bitsAttrs = new BitsAttrs(config);
	return {
		...bitsAttrs.attrs,
		selector: bitsAttrs.selector,
		getAttr: bitsAttrs.getAttr
	};
}
//#endregion
//#region node_modules/bits-ui/dist/internal/kbd-constants.js
var ARROW_DOWN = "ArrowDown";
var ARROW_LEFT = "ArrowLeft";
var ARROW_RIGHT = "ArrowRight";
var ARROW_UP = "ArrowUp";
var HOME = "Home";
//#endregion
//#region node_modules/bits-ui/dist/internal/is.js
var isBrowser = typeof document !== "undefined";
getIsIOS();
function getIsIOS() {
	return isBrowser && window?.navigator?.userAgent && (/iP(ad|hone|od)/.test(window.navigator.userAgent) || window?.navigator?.maxTouchPoints > 2 && /iPad|Macintosh/.test(window?.navigator.userAgent));
}
function isElementOrSVGElement(element) {
	return element instanceof Element || element instanceof SVGElement;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/noop.js
/**
* A no operation function (does nothing)
*/
function noop() {}
//#endregion
//#region node_modules/bits-ui/dist/internal/create-id.js
function createId(prefixOrUid, uid) {
	if (uid === void 0) return `bits-${prefixOrUid}`;
	return `bits-${prefixOrUid}-${uid}`;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/arrays.js
/**
* Checks if the given index is valid for the given array.
*
* @param index - The index to check
* @param arr - The array to check
*/
function isValidIndex(index, arr) {
	return index >= 0 && index < arr.length;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/svelte-resize-observer.svelte.js
var SvelteResizeObserver = class {
	#node;
	#onResize;
	constructor(node, onResize) {
		this.#node = node;
		this.#onResize = onResize;
		this.handler = this.handler.bind(this);
	}
	handler() {
		let rAF = 0;
		const _node = this.#node();
		if (!_node) return;
		const resizeObserver = new ResizeObserver(() => {
			cancelAnimationFrame(rAF);
			rAF = window.requestAnimationFrame(this.#onResize);
		});
		resizeObserver.observe(_node);
		return () => {
			window.cancelAnimationFrame(rAF);
			resizeObserver.unobserve(_node);
		};
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/helpers.js
function getRangeStyles(direction, min, max) {
	const styles = { position: "absolute" };
	if (direction === "lr") {
		styles.left = `${min}%`;
		styles.right = `${max}%`;
	} else if (direction === "rl") {
		styles.right = `${min}%`;
		styles.left = `${max}%`;
	} else if (direction === "bt") {
		styles.bottom = `${min}%`;
		styles.top = `${max}%`;
	} else {
		styles.top = `${min}%`;
		styles.bottom = `${max}%`;
	}
	return styles;
}
function getThumbStyles(direction, thumbPos) {
	const styles = { position: "absolute" };
	if (direction === "lr") {
		styles.left = `${thumbPos}%`;
		styles.translate = "-50% 0";
	} else if (direction === "rl") {
		styles.right = `${thumbPos}%`;
		styles.translate = "50% 0";
	} else if (direction === "bt") {
		styles.bottom = `${thumbPos}%`;
		styles.translate = "0 50%";
	} else {
		styles.top = `${thumbPos}%`;
		styles.translate = "0 -50%";
	}
	return styles;
}
function getTickStyles(direction, tickPosition, offsetPercentage) {
	const style = { position: "absolute" };
	if (direction === "lr") {
		style.left = `${tickPosition}%`;
		style.translate = `${offsetPercentage}% 0`;
	} else if (direction === "rl") {
		style.right = `${tickPosition}%`;
		style.translate = `${-offsetPercentage}% 0`;
	} else if (direction === "bt") {
		style.bottom = `${tickPosition}%`;
		style.translate = `0 ${-offsetPercentage}%`;
	} else {
		style.top = `${tickPosition}%`;
		style.translate = `0 ${offsetPercentage}%`;
	}
	return style;
}
/**
* Gets the number of decimal places in a number
*/
function getDecimalPlaces(num) {
	if (Math.floor(num) === num) return 0;
	const str = num.toString();
	if (str.indexOf(".") !== -1 && str.indexOf("e-") === -1) return str.split(".")[1].length;
	else if (str.indexOf("e-") !== -1) {
		const parts = str.split("e-");
		return parseInt(parts[1], 10);
	}
	return 0;
}
/**
* Rounds a number to the specified number of decimal places
*/
function roundToPrecision(num, precision) {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
}
/**
* Normalizes step to always be a sorted array of valid values within min/max range
*/
function normalizeSteps(step, min, max) {
	if (typeof step === "number") {
		const difference = max - min;
		let count = Math.ceil(difference / step);
		const precision = getDecimalPlaces(step);
		const factor = Math.pow(10, precision);
		if (Math.round(difference * factor) % Math.round(step * factor) === 0) count++;
		const steps = [];
		for (let i = 0; i < count; i++) {
			const roundedValue = roundToPrecision(min + i * step, precision);
			steps.push(roundedValue);
		}
		return steps;
	}
	return [...new Set(step)].filter((value) => value >= min && value <= max).sort((a, b) => a - b);
}
/**
* Snaps a value to the nearest step in a custom steps array
*/
function snapValueToCustomSteps(value, steps) {
	if (steps.length === 0) return value;
	let closest = steps[0];
	let minDistance = Math.abs(value - closest);
	for (const step of steps) {
		const distance = Math.abs(value - step);
		if (distance < minDistance) {
			minDistance = distance;
			closest = step;
		}
	}
	return closest;
}
/**
* Gets the next/previous step value for keyboard navigation
*/
function getAdjacentStepValue(currentValue, steps, direction) {
	const currentIndex = steps.indexOf(currentValue);
	if (currentIndex === -1) return snapValueToCustomSteps(currentValue, steps);
	if (direction === "next") return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : currentValue;
	else return currentIndex > 0 ? steps[currentIndex - 1] : currentValue;
}
//#endregion
//#region node_modules/bits-ui/dist/internal/math.js
function linearScale(domain, range, clamp = true) {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	const slope = (r1 - r0) / (d1 - d0);
	return (x) => {
		const result = r0 + slope * (x - d0);
		if (!clamp) return result;
		if (result > Math.max(r0, r1)) return Math.max(r0, r1);
		if (result < Math.min(r0, r1)) return Math.min(r0, r1);
		return result;
	};
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/slider.svelte.js
var sliderAttrs = createBitsAttrs({
	component: "slider",
	parts: [
		"root",
		"thumb",
		"range",
		"tick",
		"tick-label",
		"thumb-label"
	]
});
var SliderRootContext = new Context("Slider.Root");
var SliderBaseRootState = class {
	opts;
	attachment;
	isActive = false;
	#layoutVersion = 0;
	#direction = derived(() => {
		if (this.opts.orientation.current === "horizontal") return this.opts.dir.current === "rtl" ? "rl" : "lr";
		else return this.opts.dir.current === "rtl" ? "tb" : "bt";
	});
	get direction() {
		return this.#direction();
	}
	set direction($$value) {
		return this.#direction($$value);
	}
	#normalizedSteps = derived(() => {
		return normalizeSteps(this.opts.step.current, this.opts.min.current, this.opts.max.current);
	});
	get normalizedSteps() {
		return this.#normalizedSteps();
	}
	set normalizedSteps($$value) {
		return this.#normalizedSteps($$value);
	}
	domContext;
	constructor(opts) {
		this.opts = opts;
		this.attachment = attachRef(opts.ref);
		this.domContext = new DOMContext(this.opts.ref);
		new SvelteResizeObserver(() => this.opts.ref.current, this.#handleLayoutChange);
	}
	#handleLayoutChange = () => {
		this.#layoutVersion += 1;
	};
	isThumbActive(_index) {
		return this.isActive;
	}
	#touchAction = derived(() => {
		if (this.opts.disabled.current) return void 0;
		return this.opts.orientation.current === "horizontal" ? "pan-y" : "pan-x";
	});
	getAllThumbs = () => {
		const node = this.opts.ref.current;
		if (!node) return [];
		return Array.from(node.querySelectorAll(sliderAttrs.selector("thumb")));
	};
	getThumbScale = () => {
		this.#layoutVersion;
		const trackPadding = this.opts.trackPadding?.current;
		if (trackPadding !== void 0 && trackPadding > 0) return [trackPadding, 100 - trackPadding];
		if (this.opts.thumbPositioning.current === "exact") return [0, 100];
		const isVertical = this.opts.orientation.current === "vertical";
		const activeThumb = this.getAllThumbs()[0];
		const thumbSize = isVertical ? activeThumb?.offsetHeight : activeThumb?.offsetWidth;
		if (thumbSize === void 0 || Number.isNaN(thumbSize) || thumbSize === 0) return [0, 100];
		const trackSize = isVertical ? this.opts.ref.current?.offsetHeight : this.opts.ref.current?.offsetWidth;
		if (trackSize === void 0 || Number.isNaN(trackSize) || trackSize === 0) return [0, 100];
		const percentPadding = thumbSize / 2 / trackSize * 100;
		return [percentPadding, 100 - percentPadding];
	};
	getPositionFromValue = (thumbValue) => {
		const thumbScale = this.getThumbScale();
		return linearScale([this.opts.min.current, this.opts.max.current], thumbScale)(thumbValue);
	};
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-orientation": this.opts.orientation.current,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
		style: { touchAction: this.#touchAction() },
		[sliderAttrs.root]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SliderSingleRootState = class extends SliderBaseRootState {
	opts;
	isMulti = false;
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch([
			() => this.opts.step.current,
			() => this.opts.min.current,
			() => this.opts.max.current,
			() => this.opts.value.current
		], ([step, min, max, value]) => {
			const steps = normalizeSteps(step, min, max);
			const isValidValue = (v) => {
				return steps.includes(v);
			};
			const gcv = (v) => {
				return snapValueToCustomSteps(v, steps);
			};
			if (!isValidValue(value)) this.opts.value.current = gcv(value);
		});
	}
	isTickValueSelected = (tickValue) => {
		return this.opts.value.current === tickValue;
	};
	applyPosition({ clientXY, start, end }) {
		const min = this.opts.min.current;
		const max = this.opts.max.current;
		const val = (clientXY - start) / (end - start) * (max - min) + min;
		if (val < min) this.updateValue(min);
		else if (val > max) this.updateValue(max);
		else {
			const steps = this.normalizedSteps;
			const newValue = snapValueToCustomSteps(val, steps);
			this.updateValue(newValue);
		}
	}
	updateValue = (newValue) => {
		this.opts.value.current = snapValueToCustomSteps(newValue, this.normalizedSteps);
	};
	handlePointerMove = (e) => {
		if (!this.isActive || this.opts.disabled.current) return;
		e.preventDefault();
		e.stopPropagation();
		const sliderNode = this.opts.ref.current;
		const activeThumb = this.getAllThumbs()[0];
		if (!sliderNode || !activeThumb) return;
		activeThumb.focus();
		const { left, right, top, bottom } = sliderNode.getBoundingClientRect();
		if (this.direction === "lr") this.applyPosition({
			clientXY: e.clientX,
			start: left,
			end: right
		});
		else if (this.direction === "rl") this.applyPosition({
			clientXY: e.clientX,
			start: right,
			end: left
		});
		else if (this.direction === "bt") this.applyPosition({
			clientXY: e.clientY,
			start: bottom,
			end: top
		});
		else if (this.direction === "tb") this.applyPosition({
			clientXY: e.clientY,
			start: top,
			end: bottom
		});
	};
	handlePointerDown = (e) => {
		if (e.button !== 0 || this.opts.disabled.current) return;
		const sliderNode = this.opts.ref.current;
		const closestThumb = this.getAllThumbs()[0];
		if (!closestThumb || !sliderNode) return;
		const target = e.composedPath()[0] ?? e.target;
		if (!isElementOrSVGElement(target) || !sliderNode.contains(target)) return;
		e.preventDefault();
		closestThumb.focus();
		this.isActive = true;
		this.handlePointerMove(e);
	};
	handlePointerUp = () => {
		if (this.opts.disabled.current) return;
		if (this.isActive) this.opts.onValueCommit.current(run(() => this.opts.value.current));
		this.isActive = false;
	};
	#thumbsPropsArr = derived(() => {
		const currValue = this.opts.value.current;
		return Array.from({ length: 1 }, () => {
			const thumbValue = currValue;
			const thumbPosition = this.getPositionFromValue(thumbValue);
			const style = getThumbStyles(this.direction, thumbPosition);
			return {
				role: "slider",
				"aria-valuemin": this.opts.min.current,
				"aria-valuemax": this.opts.max.current,
				"aria-valuenow": thumbValue,
				"aria-disabled": boolToStr(this.opts.disabled.current),
				"aria-orientation": this.opts.orientation.current,
				"data-value": thumbValue,
				"data-orientation": this.opts.orientation.current,
				style,
				[sliderAttrs.thumb]: ""
			};
		});
	});
	get thumbsPropsArr() {
		return this.#thumbsPropsArr();
	}
	set thumbsPropsArr($$value) {
		return this.#thumbsPropsArr($$value);
	}
	#thumbsRenderArr = derived(() => {
		return this.thumbsPropsArr.map((_, i) => i);
	});
	get thumbsRenderArr() {
		return this.#thumbsRenderArr();
	}
	set thumbsRenderArr($$value) {
		return this.#thumbsRenderArr($$value);
	}
	#ticksPropsArr = derived(() => {
		const steps = this.normalizedSteps;
		const currValue = this.opts.value.current;
		return steps.map((tickValue, i) => {
			const tickPosition = this.getPositionFromValue(tickValue);
			const isFirst = i === 0;
			const isLast = i === steps.length - 1;
			const offsetPercentage = isFirst ? 0 : isLast ? -100 : -50;
			const style = getTickStyles(this.direction, tickPosition, offsetPercentage);
			const bounded = tickValue <= currValue;
			return {
				"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
				"data-orientation": this.opts.orientation.current,
				"data-bounded": bounded ? "" : void 0,
				"data-value": tickValue,
				"data-selected": this.isTickValueSelected(tickValue) ? "" : void 0,
				style,
				[sliderAttrs.tick]: ""
			};
		});
	});
	get ticksPropsArr() {
		return this.#ticksPropsArr();
	}
	set ticksPropsArr($$value) {
		return this.#ticksPropsArr($$value);
	}
	#ticksRenderArr = derived(() => {
		return this.ticksPropsArr.map((_, i) => i);
	});
	get ticksRenderArr() {
		return this.#ticksRenderArr();
	}
	set ticksRenderArr($$value) {
		return this.#ticksRenderArr($$value);
	}
	#tickItemsArr = derived(() => {
		return this.ticksPropsArr.map((tick, i) => ({
			value: tick["data-value"],
			index: i
		}));
	});
	get tickItemsArr() {
		return this.#tickItemsArr();
	}
	set tickItemsArr($$value) {
		return this.#tickItemsArr($$value);
	}
	#thumbItemsArr = derived(() => {
		return [{
			value: this.opts.value.current,
			index: 0
		}];
	});
	get thumbItemsArr() {
		return this.#thumbItemsArr();
	}
	set thumbItemsArr($$value) {
		return this.#thumbItemsArr($$value);
	}
	#snippetProps = derived(() => ({
		ticks: this.ticksRenderArr,
		thumbs: this.thumbsRenderArr,
		tickItems: this.tickItemsArr,
		thumbItems: this.thumbItemsArr
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
};
var SliderMultiRootState = class extends SliderBaseRootState {
	opts;
	isMulti = true;
	activeThumb = null;
	currentThumbIdx = 0;
	constructor(opts) {
		super(opts);
		this.opts = opts;
		watch([
			() => this.opts.step.current,
			() => this.opts.min.current,
			() => this.opts.max.current,
			() => this.opts.value.current
		], ([step, min, max, value]) => {
			const steps = normalizeSteps(step, min, max);
			const isValidValue = (v) => {
				return steps.includes(v);
			};
			const gcv = (v) => {
				return snapValueToCustomSteps(v, steps);
			};
			if (value.some((v) => !isValidValue(v))) this.opts.value.current = value.map(gcv);
		});
	}
	isTickValueSelected = (tickValue) => {
		return this.opts.value.current.includes(tickValue);
	};
	isThumbActive(index) {
		return this.isActive && this.activeThumb?.idx === index;
	}
	applyPosition({ clientXY, activeThumbIdx, start, end }) {
		const min = this.opts.min.current;
		const max = this.opts.max.current;
		const val = (clientXY - start) / (end - start) * (max - min) + min;
		if (val < min) this.updateValue(min, activeThumbIdx);
		else if (val > max) this.updateValue(max, activeThumbIdx);
		else {
			const steps = this.normalizedSteps;
			const newValue = snapValueToCustomSteps(val, steps);
			this.updateValue(newValue, activeThumbIdx);
		}
	}
	#getClosestThumb = (e) => {
		const thumbs = this.getAllThumbs();
		if (!thumbs.length) return;
		for (const thumb of thumbs) thumb.blur();
		const distances = thumbs.map((thumb) => {
			if (this.opts.orientation.current === "horizontal") {
				const { left, right } = thumb.getBoundingClientRect();
				return Math.abs(e.clientX - (left + right) / 2);
			} else {
				const { top, bottom } = thumb.getBoundingClientRect();
				return Math.abs(e.clientY - (top + bottom) / 2);
			}
		});
		const node = thumbs[distances.indexOf(Math.min(...distances))];
		return {
			node,
			idx: thumbs.indexOf(node)
		};
	};
	handlePointerMove = (e) => {
		if (!this.isActive || this.opts.disabled.current) return;
		e.preventDefault();
		e.stopPropagation();
		const sliderNode = this.opts.ref.current;
		const activeThumb = this.activeThumb;
		if (!sliderNode || !activeThumb) return;
		activeThumb.node.focus();
		const { left, right, top, bottom } = sliderNode.getBoundingClientRect();
		const direction = this.direction;
		if (direction === "lr") this.applyPosition({
			clientXY: e.clientX,
			activeThumbIdx: activeThumb.idx,
			start: left,
			end: right
		});
		else if (direction === "rl") this.applyPosition({
			clientXY: e.clientX,
			activeThumbIdx: activeThumb.idx,
			start: right,
			end: left
		});
		else if (direction === "bt") this.applyPosition({
			clientXY: e.clientY,
			activeThumbIdx: activeThumb.idx,
			start: bottom,
			end: top
		});
		else if (direction === "tb") this.applyPosition({
			clientXY: e.clientY,
			activeThumbIdx: activeThumb.idx,
			start: top,
			end: bottom
		});
	};
	handlePointerDown = (e) => {
		if (e.button !== 0 || this.opts.disabled.current) return;
		const sliderNode = this.opts.ref.current;
		const closestThumb = this.#getClosestThumb(e);
		if (!closestThumb || !sliderNode) return;
		const target = e.composedPath()[0] ?? e.target;
		if (!isElementOrSVGElement(target) || !sliderNode.contains(target)) return;
		e.preventDefault();
		this.activeThumb = closestThumb;
		closestThumb.node.focus();
		this.isActive = true;
		this.handlePointerMove(e);
	};
	handlePointerUp = () => {
		if (this.opts.disabled.current) return;
		if (this.isActive) this.opts.onValueCommit.current(run(() => this.opts.value.current));
		this.isActive = false;
	};
	getAllThumbs = () => {
		const node = this.opts.ref.current;
		if (!node) return [];
		return Array.from(node.querySelectorAll(sliderAttrs.selector("thumb")));
	};
	updateValue = (thumbValue, idx) => {
		const currValue = this.opts.value.current;
		if (!currValue.length) {
			this.opts.value.current.push(thumbValue);
			return;
		}
		if (currValue[idx] === thumbValue) return;
		const newValue = [...currValue];
		if (!isValidIndex(idx, newValue)) return;
		const direction = newValue[idx] > thumbValue ? -1 : 1;
		const swap = () => {
			const diffIndex = idx + direction;
			newValue[idx] = newValue[diffIndex];
			newValue[diffIndex] = thumbValue;
			const thumbs = this.getAllThumbs();
			if (!thumbs.length) return;
			thumbs[diffIndex]?.focus();
			this.activeThumb = {
				node: thumbs[diffIndex],
				idx: diffIndex
			};
		};
		if (this.opts.autoSort.current && (direction === -1 && thumbValue < newValue[idx - 1] || direction === 1 && thumbValue > newValue[idx + 1])) {
			swap();
			this.opts.value.current = newValue;
			return;
		}
		const steps = this.normalizedSteps;
		newValue[idx] = snapValueToCustomSteps(thumbValue, steps);
		this.opts.value.current = newValue;
	};
	#thumbsPropsArr = derived(() => {
		const currValue = this.opts.value.current;
		return Array.from({ length: currValue.length || 1 }, (_, i) => {
			const currThumb = run(() => this.currentThumbIdx);
			if (currThumb < currValue.length) run(() => {
				this.currentThumbIdx = currThumb + 1;
			});
			const thumbValue = currValue[i];
			const thumbPosition = this.getPositionFromValue(thumbValue ?? 0);
			const style = getThumbStyles(this.direction, thumbPosition);
			return {
				role: "slider",
				"aria-valuemin": this.opts.min.current,
				"aria-valuemax": this.opts.max.current,
				"aria-valuenow": thumbValue,
				"aria-disabled": boolToStr(this.opts.disabled.current),
				"aria-orientation": this.opts.orientation.current,
				"data-value": thumbValue,
				"data-orientation": this.opts.orientation.current,
				style,
				[sliderAttrs.thumb]: ""
			};
		});
	});
	get thumbsPropsArr() {
		return this.#thumbsPropsArr();
	}
	set thumbsPropsArr($$value) {
		return this.#thumbsPropsArr($$value);
	}
	#thumbsRenderArr = derived(() => {
		return this.thumbsPropsArr.map((_, i) => i);
	});
	get thumbsRenderArr() {
		return this.#thumbsRenderArr();
	}
	set thumbsRenderArr($$value) {
		return this.#thumbsRenderArr($$value);
	}
	#ticksPropsArr = derived(() => {
		const steps = this.normalizedSteps;
		const currValue = this.opts.value.current;
		return steps.map((tickValue, i) => {
			const tickPosition = this.getPositionFromValue(tickValue);
			const isFirst = i === 0;
			const isLast = i === steps.length - 1;
			const offsetPercentage = isFirst ? 0 : isLast ? -100 : -50;
			const style = getTickStyles(this.direction, tickPosition, offsetPercentage);
			const bounded = currValue.length === 1 ? tickValue <= currValue[0] : currValue[0] <= tickValue && tickValue <= currValue[currValue.length - 1];
			return {
				"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current),
				"data-orientation": this.opts.orientation.current,
				"data-bounded": bounded ? "" : void 0,
				"data-value": tickValue,
				style,
				[sliderAttrs.tick]: ""
			};
		});
	});
	get ticksPropsArr() {
		return this.#ticksPropsArr();
	}
	set ticksPropsArr($$value) {
		return this.#ticksPropsArr($$value);
	}
	#ticksRenderArr = derived(() => {
		return this.ticksPropsArr.map((_, i) => i);
	});
	get ticksRenderArr() {
		return this.#ticksRenderArr();
	}
	set ticksRenderArr($$value) {
		return this.#ticksRenderArr($$value);
	}
	#tickItemsArr = derived(() => {
		return this.ticksPropsArr.map((tick, i) => ({
			value: tick["data-value"],
			index: i
		}));
	});
	get tickItemsArr() {
		return this.#tickItemsArr();
	}
	set tickItemsArr($$value) {
		return this.#tickItemsArr($$value);
	}
	#thumbItemsArr = derived(() => {
		return this.opts.value.current.map((value, index) => ({
			value,
			index
		}));
	});
	get thumbItemsArr() {
		return this.#thumbItemsArr();
	}
	set thumbItemsArr($$value) {
		return this.#thumbItemsArr($$value);
	}
	#snippetProps = derived(() => ({
		ticks: this.ticksRenderArr,
		thumbs: this.thumbsRenderArr,
		tickItems: this.tickItemsArr,
		thumbItems: this.thumbItemsArr
	}));
	get snippetProps() {
		return this.#snippetProps();
	}
	set snippetProps($$value) {
		return this.#snippetProps($$value);
	}
};
var SliderRootState = class {
	static create(opts) {
		const { type, ...rest } = opts;
		const rootState = type === "single" ? new SliderSingleRootState(rest) : new SliderMultiRootState(rest);
		return SliderRootContext.set(rootState);
	}
};
var VALID_SLIDER_KEYS = [
	ARROW_LEFT,
	ARROW_RIGHT,
	ARROW_UP,
	ARROW_DOWN,
	HOME,
	"End"
];
var SliderRangeState = class SliderRangeState {
	static create(opts) {
		return new SliderRangeState(opts, SliderRootContext.get());
	}
	opts;
	root;
	attachment;
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
	}
	#rangeStyles = derived(() => {
		if (Array.isArray(this.root.opts.value.current)) {
			const min = this.root.opts.value.current.length > 1 ? this.root.getPositionFromValue(Math.min(...this.root.opts.value.current) ?? 0) : 0;
			const max = 100 - this.root.getPositionFromValue(Math.max(...this.root.opts.value.current) ?? 0);
			return {
				position: "absolute",
				...getRangeStyles(this.root.direction, min, max)
			};
		} else {
			const trackPadding = this.root.opts.trackPadding?.current;
			const currentValue = this.root.opts.value.current;
			const maxValue = this.root.opts.max.current;
			const min = 0;
			const max = trackPadding !== void 0 && trackPadding > 0 && currentValue === maxValue ? 0 : 100 - this.root.getPositionFromValue(currentValue);
			return {
				position: "absolute",
				...getRangeStyles(this.root.direction, min, max)
			};
		}
	});
	get rangeStyles() {
		return this.#rangeStyles();
	}
	set rangeStyles($$value) {
		return this.#rangeStyles($$value);
	}
	#props = derived(() => ({
		id: this.opts.id.current,
		"data-orientation": this.root.opts.orientation.current,
		"data-disabled": boolToEmptyStrOrUndef(this.root.opts.disabled.current),
		style: this.rangeStyles,
		[sliderAttrs.range]: "",
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
var SliderThumbState = class SliderThumbState {
	static create(opts) {
		return new SliderThumbState(opts, SliderRootContext.get());
	}
	opts;
	root;
	attachment;
	#isDisabled = derived(() => this.root.opts.disabled.current || this.opts.disabled.current);
	constructor(opts, root) {
		this.opts = opts;
		this.root = root;
		this.attachment = attachRef(opts.ref);
		this.onkeydown = this.onkeydown.bind(this);
	}
	#updateValue(newValue) {
		if (this.root.isMulti) this.root.updateValue(newValue, this.opts.index.current);
		else this.root.updateValue(newValue);
	}
	onkeydown(e) {
		if (this.#isDisabled()) return;
		const currNode = this.opts.ref.current;
		if (!currNode) return;
		const thumbs = this.root.getAllThumbs();
		if (!thumbs.length) return;
		const idx = thumbs.indexOf(currNode);
		if (this.root.isMulti) this.root.currentThumbIdx = idx;
		if (!VALID_SLIDER_KEYS.includes(e.key)) return;
		e.preventDefault();
		const min = this.root.opts.min.current;
		const max = this.root.opts.max.current;
		const value = this.root.opts.value.current;
		const thumbValue = Array.isArray(value) ? value[idx] : value;
		const orientation = this.root.opts.orientation.current;
		const direction = this.root.direction;
		const steps = this.root.normalizedSteps;
		switch (e.key) {
			case HOME:
				this.#updateValue(min);
				break;
			case "End":
				this.#updateValue(max);
				break;
			case ARROW_LEFT:
				if (orientation !== "horizontal") break;
				if (e.metaKey) {
					const newValue = direction === "rl" ? max : min;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "rl" ? "next" : "prev");
					this.#updateValue(newValue);
				}
				break;
			case ARROW_RIGHT:
				if (orientation !== "horizontal") break;
				if (e.metaKey) {
					const newValue = direction === "rl" ? min : max;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "rl" ? "prev" : "next");
					this.#updateValue(newValue);
				}
				break;
			case ARROW_UP:
				if (e.metaKey) {
					const newValue = direction === "tb" ? min : max;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "tb" ? "prev" : "next");
					this.#updateValue(newValue);
				}
				break;
			case ARROW_DOWN:
				if (e.metaKey) {
					const newValue = direction === "tb" ? max : min;
					this.#updateValue(newValue);
				} else {
					const newValue = getAdjacentStepValue(thumbValue, steps, direction === "tb" ? "next" : "prev");
					this.#updateValue(newValue);
				}
				break;
		}
		this.root.opts.onValueCommit.current(this.root.opts.value.current);
	}
	#props = derived(() => ({
		...this.root.thumbsPropsArr[this.opts.index.current],
		id: this.opts.id.current,
		onkeydown: this.onkeydown,
		"data-active": this.root.isThumbActive(this.opts.index.current) ? "" : void 0,
		"data-disabled": boolToEmptyStrOrUndef(this.opts.disabled.current || this.root.opts.disabled.current),
		tabindex: this.opts.disabled.current || this.root.opts.disabled.current ? -1 : 0,
		...this.attachment
	}));
	get props() {
		return this.#props();
	}
	set props($$value) {
		return this.#props($$value);
	}
};
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/components/slider.svelte
function Slider($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, id = createId(uid), ref = null, value = void 0, type, onValueChange = noop, onValueCommit = noop, disabled = false, min: minProp, max: maxProp, step = 1, dir = "ltr", autoSort = true, orientation = "horizontal", thumbPositioning = "contain", trackPadding, $$slots, $$events, ...restProps } = $$props;
		const min = derived(() => {
			if (minProp !== void 0) return minProp;
			if (Array.isArray(step)) return Math.min(...step);
			return 0;
		});
		const max = derived(() => {
			if (maxProp !== void 0) return maxProp;
			if (Array.isArray(step)) return Math.max(...step);
			return 100;
		});
		function handleDefaultValue() {
			if (value !== void 0) return;
			if (type === "single") return min();
			return [];
		}
		handleDefaultValue();
		watch.pre(() => value, () => {
			handleDefaultValue();
		});
		const rootState = SliderRootState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			value: boxWith(() => value, (v) => {
				value = v;
				onValueChange(v);
			}),
			onValueCommit: boxWith(() => onValueCommit),
			disabled: boxWith(() => disabled),
			min: boxWith(() => min()),
			max: boxWith(() => max()),
			step: boxWith(() => step),
			dir: boxWith(() => dir),
			autoSort: boxWith(() => autoSort),
			orientation: boxWith(() => orientation),
			thumbPositioning: boxWith(() => thumbPositioning),
			type,
			trackPadding: boxWith(() => trackPadding)
		});
		const mergedProps = derived(() => mergeProps(restProps, rootState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, {
				props: mergedProps(),
				...rootState.snippetProps
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer, rootState.snippetProps);
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			ref,
			value
		});
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/components/slider-range.svelte
function Slider_range($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, ref = null, id = createId(uid), $$slots, $$events, ...restProps } = $$props;
		const rangeState = SliderRangeState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v)
		});
		const mergedProps = derived(() => mergeProps(restProps, rangeState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/bits-ui/dist/bits/slider/components/slider-thumb.svelte
function Slider_thumb($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { children, child, ref = null, id = createId(uid), index, disabled = false, $$slots, $$events, ...restProps } = $$props;
		const thumbState = SliderThumbState.create({
			id: boxWith(() => id),
			ref: boxWith(() => ref, (v) => ref = v),
			index: boxWith(() => index),
			disabled: boxWith(() => disabled)
		});
		const mergedProps = derived(() => mergeProps(restProps, thumbState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, {
				active: thumbState.root.isThumbActive(thumbState.opts.index.current),
				props: mergedProps()
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span${attributes({ ...mergedProps() })}>`);
			children?.($$renderer, { active: thumbState.root.isThumbActive(thumbState.opts.index.current) });
			$$renderer.push(`<!----></span>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/routes/player/VolumeOverlay.svelte
function VolumeOverlay($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let volume = 1;
		let visible = false;
		const pct = derived(() => Math.round(volume * 100));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="wheel-zone svelte-18peanu"><div${attr_class("overlay svelte-18peanu", void 0, { "visible": visible })} role="group" aria-label="Volume control"><button class="mute-btn svelte-18peanu"${attr("aria-label", volume === 0 ? "Unmute" : "Mute")}>`);
			if (volume === 0) {
				$$renderer.push("<!--[0-->");
				Volume_x($$renderer, { size: 14 });
			} else {
				$$renderer.push("<!--[-1-->");
				Volume_2($$renderer, { size: 14 });
			}
			$$renderer.push(`<!--]--></button> `);
			{
				function children($$renderer, { thumbItems }) {
					if (Slider_range) {
						$$renderer.push("<!--[-->");
						Slider_range($$renderer, { class: "vol-range" });
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
					$$renderer.push(` <!--[-->`);
					const each_array = ensure_array_like(thumbItems);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let thumb = each_array[$$index];
						if (Slider_thumb) {
							$$renderer.push("<!--[-->");
							Slider_thumb($$renderer, {
								class: "vol-thumb",
								index: thumb.index
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					}
					$$renderer.push(`<!--]-->`);
				}
				if (Slider) {
					$$renderer.push("<!--[-->");
					Slider($$renderer, {
						class: "vol-slider",
						type: "single",
						min: 0,
						max: 1,
						step: .01,
						"aria-label": "Master volume",
						get value() {
							return volume;
						},
						set value($$value) {
							volume = $$value;
							$$settled = false;
						},
						children,
						$$slots: { default: true }
					});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
			$$renderer.push(` <span class="label svelte-18peanu">${escape_html(pct())}%</span></div></div>`);
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
//#region src/routes/player/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* Called by StoryGate after its fade animation completes. Starts Tone.js
		* and applies the initial scene/ambience/music state from the server.
		*/
		async function unlock() {
			await Tone.start();
			appState.renderReady = true;
			if (appState.scene?.id) sceneState.requestedSceneId = appState.scene.id;
			if (appState.ambiences?.length) await ambienceEngine.syncActive(appState.ambiences);
			if (appState.music?.id) await musicEngine.setPlaylist(appState.music.id, appState.music.volume);
		}
		onDestroy(() => {
			musicEngine.reset();
			ambienceEngine.syncActive([]);
			sceneState.current = null;
			sceneState.next = null;
			sceneState.isTransitioning = false;
			sceneState.requestedSceneId = null;
			appState.renderReady = false;
		});
		if (!appState.renderReady) {
			$$renderer.push("<!--[0-->");
			StoryGate($$renderer, {
				onunlock: unlock,
				title: "At the Grove of the Well"
			});
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="player svelte-nefmhu">`);
			SceneRenderer($$renderer, { slotState: sceneState });
			$$renderer.push(`<!----> `);
			VolumeOverlay($$renderer, {});
			$$renderer.push(`<!----> `);
			if (appState.debug) {
				$$renderer.push("<!--[0-->");
				DebugOverlay($$renderer, {});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };
