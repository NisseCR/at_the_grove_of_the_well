import { API_BASE } from "@/lib/config";

class ApiClient {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const init = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

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

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async upload<T>(endpoint: string, body: FormData): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body });
    if (!response.ok) throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    return response.json();
  }
}

export const apiClient = new ApiClient();
