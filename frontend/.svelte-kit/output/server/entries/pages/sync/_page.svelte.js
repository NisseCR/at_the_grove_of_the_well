import { $ as attr, tt as escape_html } from "../../../chunks/index-server.js";
import "../../../chunks/navigation.js";
import { t as apiClient } from "../../../chunks/apiClient.js";
//#region src/lib/services/adminApiClient.ts
var AdminApiClient = class {
	/**
	* @returns Triggers a fresh R2 scan and returns entity counts.
	*/
	async sync() {
		return apiClient.post("/admin/sync", {});
	}
};
new AdminApiClient();
//#endregion
//#region src/routes/sync/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<div class="sync-view svelte-pillow"><div class="bg svelte-pillow"></div> <nav class="topnav svelte-pillow"><button class="back svelte-pillow">← Home</button> <span class="title svelte-pillow">Sync</span></nav> <div class="main svelte-pillow"><div class="card svelte-pillow"><p class="description svelte-pillow">Scans R2 for ambiences and playlists, and reloads scene configs from
        disk.</p> <button class="sync-btn svelte-pillow"${attr("disabled", false, true)}>${escape_html("Sync Now")}</button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}
//#endregion
export { _page as default };
