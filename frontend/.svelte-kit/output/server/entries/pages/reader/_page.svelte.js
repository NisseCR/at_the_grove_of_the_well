import { d as ensure_array_like, tt as escape_html } from "../../../chunks/index-server.js";
import "../../../chunks/navigation.js";
import "../../../chunks/readerApiClient.js";
//#region src/routes/reader/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let stories = [];
		$$renderer.push(`<div class="index svelte-brg3ig"><div class="bg svelte-brg3ig"></div> <div class="index-content svelte-brg3ig"><h1 class="index-title svelte-brg3ig">Stories</h1> <nav class="story-list svelte-brg3ig"><!--[-->`);
		const each_array = ensure_array_like(stories);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let story = each_array[$$index];
			$$renderer.push(`<button class="story-card svelte-brg3ig"><span class="story-name svelte-brg3ig">${escape_html(story.title)}</span></button>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!stories.length) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<p class="empty svelte-brg3ig">No stories yet.</p>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></nav> <button class="nav-link svelte-brg3ig">← Home</button></div></div>`);
	});
}
//#endregion
export { _page as default };
