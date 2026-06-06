var WS_BASE = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
var API_BASE = "/api";
var ASSETS_BASE = "https://assets.paracosm-vtt.com";
function assetUrl(src) {
	return `${ASSETS_BASE}/${src}`;
}
//#endregion
//#region src/lib/services/apiClient.ts
var ApiClient = class {
	async request(endpoint, options = {}) {
		const url = `${API_BASE}${endpoint}`;
		const init = {
			headers: {
				"Content-Type": "application/json",
				...options.headers
			},
			...options
		};
		const response = await fetch(url, init);
		if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
		if (response.status === 204) return void 0;
		return response.json();
	}
	get(endpoint) {
		return this.request(endpoint, { method: "GET" });
	}
	post(endpoint, body) {
		return this.request(endpoint, {
			method: "POST",
			body: JSON.stringify(body)
		});
	}
	put(endpoint, body) {
		return this.request(endpoint, {
			method: "PUT",
			body: JSON.stringify(body)
		});
	}
	patch(endpoint, body) {
		return this.request(endpoint, {
			method: "PATCH",
			body: JSON.stringify(body)
		});
	}
	delete(endpoint) {
		return this.request(endpoint, { method: "DELETE" });
	}
	async uploadForm(endpoint, formData) {
		const url = `${API_BASE}${endpoint}`;
		const response = await fetch(url, {
			method: "POST",
			body: formData
		});
		if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
		if (response.status === 204) return void 0;
		return response.json();
	}
};
var apiClient = new ApiClient();
//#endregion
export { assetUrl as i, API_BASE as n, WS_BASE as r, apiClient as t };
