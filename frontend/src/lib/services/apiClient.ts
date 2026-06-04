import { API_BASE } from "@/lib/config";
import { auth } from "@/stores/auth.svelte";

class ApiClient {
  private authHeaders(): Record<string, string> {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const init = {
      headers: {
        "Content-Type": "application/json",
        ...this.authHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: "POST", body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) });
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadForm<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json();
  }
}

export const apiClient = new ApiClient();
