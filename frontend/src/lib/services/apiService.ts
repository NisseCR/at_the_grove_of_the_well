import { API_BASE } from "@/lib/config";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   *
   * @param endpoint
   * @param options
   * @returns
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
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

  /**
   *
   * @param endpoint
   * @returns
   */
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   *
   * @param endpoint
   * @param body
   * @returns
   */
  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   *
   * @param endpoint
   * @param body
   * @returns
   */
  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   *
   * @param endpoint
   * @returns
   */
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
