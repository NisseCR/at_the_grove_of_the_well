import { n as API_BASE, t as apiClient } from "./apiClient.js";
//#region src/lib/services/readerApiClient.ts
var ReaderApiClient = class {
	/** @returns Slug and title for every available story. */
	async list() {
		return apiClient.get("/reader");
	}
	/**
	* Fetch the raw markdown content of a story by slug.
	* Uses response.text() — the backend serves text/plain, not JSON.
	*
	* @returns Raw markdown string.
	*/
	async fetch(slug) {
		const response = await fetch(`${API_BASE}/reader/${slug}`);
		if (!response.ok) throw new Error(`Reader fetch failed: ${response.status}`);
		return response.text();
	}
};
var readerApiClient = new ReaderApiClient();
//#endregion
export { readerApiClient as t };
