import "../../chunks/index-server.js";
import "../../chunks/navigation.js";
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="home svelte-1uha8ag"><div class="bg svelte-1uha8ag"></div> <div class="content svelte-1uha8ag"><h1 class="title svelte-1uha8ag">At the Grove of the Well</h1> <nav class="cards svelte-1uha8ag"><button class="card svelte-1uha8ag"><span class="card-label svelte-1uha8ag">Player</span> <span class="card-desc svelte-1uha8ag">The audio-visual experience</span></button> <button class="card svelte-1uha8ag"><span class="card-label svelte-1uha8ag">Controller</span> <span class="card-desc svelte-1uha8ag">Set scenes, ambiences and music</span></button> <button class="card svelte-1uha8ag"><span class="card-label svelte-1uha8ag">Sync</span> <span class="card-desc svelte-1uha8ag">Reload content from R2</span></button> <button class="card svelte-1uha8ag"><span class="card-label svelte-1uha8ag">Reader</span> <span class="card-desc svelte-1uha8ag">Immersive story experience</span></button></nav></div></div>`);
	});
}
//#endregion
export { _page as default };
