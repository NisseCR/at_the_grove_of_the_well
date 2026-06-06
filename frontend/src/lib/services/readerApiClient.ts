import { API_BASE } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { ReaderFile } from "@/types/reader";

class ReaderApiClient {
  /** @returns Slug and title for every available story. */
  async list(): Promise<ReaderFile[]> {
    return apiClient.get<ReaderFile[]>("/reader");
  }

  /**
   * Fetch the raw markdown content of a story by slug.
   * Uses response.text() — the backend serves text/plain, not JSON.
   *
   * @returns Raw markdown string.
   */
  async fetch(slug: string): Promise<string> {
    const response = await fetch(`${API_BASE}/reader/${slug}`);
    if (!response.ok) throw new Error(`Reader fetch failed: ${response.status}`);
    return response.text();
  }
}

export const readerApiClient = new ReaderApiClient();
