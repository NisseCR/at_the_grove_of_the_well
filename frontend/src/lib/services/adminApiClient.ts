import { apiClient } from "$lib/services/apiClient";

export interface SyncResult {
  last_synced: string;
  ambience_categories: number;
  ambiences: number;
  playlist_categories: number;
  playlists: number;
  scene_categories: number;
  scenes: number;
}

class AdminApiClient {
  /**
   * @returns Triggers a fresh R2 scan and returns entity counts.
   */
  async sync(): Promise<SyncResult> {
    return apiClient.post<SyncResult>("/admin/sync", {});
  }
}

export const adminApiClient = new AdminApiClient();
