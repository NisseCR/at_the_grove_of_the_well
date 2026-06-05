import { assetUrl } from "@/lib/config";
import { apiClient } from "@/lib/services/apiClient";
import type { PlaylistCategory, PlaylistEditor, PlaylistTrackEditor } from "@/types/music";

/** Fields accepted when creating a new playlist. */
export interface PlaylistCreatePayload {
  label: string;
  slug?: string;
  volume?: number;
  cover_id?: string;
}

/** Fields accepted when patching a playlist. Only provided fields are changed. */
export type PlaylistPatchPayload = Partial<PlaylistCreatePayload>;

/** Fields accepted when creating a playlist category. */
export interface PlaylistCategoryCreatePayload {
  label: string;
  display_order?: number;
}

/** Fields accepted when patching a playlist category. */
export interface PlaylistCategoryPatchPayload {
  label?: string;
  display_order?: number;
}

/** Resolves CDN URLs on a raw playlist editor response. */
function resolvePlaylist(raw: PlaylistEditor): PlaylistEditor {
  return {
    ...raw,
    url: raw.src ? assetUrl(raw.src) : undefined,
    thumb_url: raw.thumb_src ? assetUrl(raw.thumb_src) : null,
    tracks: raw.tracks.map((t): PlaylistTrackEditor => ({ ...t, url: assetUrl(t.src) })),
  };
}

class PlaylistApiClient {
  // ---------------------------------------------------------------------------
  // Playlist reads
  // ---------------------------------------------------------------------------

  /** @returns All playlists with their cover and tracks. */
  async fetchPlaylists(): Promise<PlaylistEditor[]> {
    const playlists = await apiClient.get<PlaylistEditor[]>("/playlist");
    return playlists.map(resolvePlaylist);
  }

  /** @returns A single playlist by UUID. */
  async fetchPlaylist(id: string): Promise<PlaylistEditor> {
    const playlist = await apiClient.get<PlaylistEditor>(`/playlist/${id}`);
    return resolvePlaylist(playlist);
  }

  // ---------------------------------------------------------------------------
  // Playlist writes
  // ---------------------------------------------------------------------------

  /**
   * Create a new playlist.
   * @param payload - Initial field values.
   */
  async createPlaylist(payload: PlaylistCreatePayload): Promise<PlaylistEditor> {
    const playlist = await apiClient.post<PlaylistEditor>("/playlist", payload);
    return resolvePlaylist(playlist);
  }

  /**
   * Update one or more fields on a playlist.
   * @param id - Playlist UUID.
   * @param patch - Fields to update.
   */
  async patchPlaylist(id: string, patch: PlaylistPatchPayload): Promise<PlaylistEditor> {
    const playlist = await apiClient.patch<PlaylistEditor>(`/playlist/${id}`, patch);
    return resolvePlaylist(playlist);
  }

  /**
   * Permanently delete a playlist and its tracks.
   * @param id - Playlist UUID.
   */
  async deletePlaylist(id: string): Promise<void> {
    await apiClient.delete<void>(`/playlist/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Track management
  // ---------------------------------------------------------------------------

  /**
   * Append an audio asset to a playlist.
   * @param playlistId - Playlist UUID.
   * @param audioAssetId - AudioAsset UUID.
   */
  async addTrack(playlistId: string, audioAssetId: string): Promise<void> {
    await apiClient.post<void>(`/playlist/${playlistId}/tracks/${audioAssetId}`, {});
  }

  /**
   * Remove an audio asset from a playlist.
   * @param playlistId - Playlist UUID.
   * @param audioAssetId - AudioAsset UUID.
   */
  async removeTrack(playlistId: string, audioAssetId: string): Promise<void> {
    await apiClient.delete<void>(`/playlist/${playlistId}/tracks/${audioAssetId}`);
  }

  // ---------------------------------------------------------------------------
  // Category reads
  // ---------------------------------------------------------------------------

  /** @returns All playlist categories sorted by display order. */
  async fetchCategories(): Promise<PlaylistCategory[]> {
    return apiClient.get<PlaylistCategory[]>("/playlist/categories");
  }

  // ---------------------------------------------------------------------------
  // Category writes
  // ---------------------------------------------------------------------------

  /**
   * Create a new playlist category.
   * @param payload - Initial field values.
   */
  async createCategory(payload: PlaylistCategoryCreatePayload): Promise<PlaylistCategory> {
    return apiClient.post<PlaylistCategory>("/playlist/categories", payload);
  }

  /**
   * Update one or more fields on a playlist category.
   * @param id - Category UUID.
   * @param patch - Fields to update.
   */
  async patchCategory(id: string, patch: PlaylistCategoryPatchPayload): Promise<PlaylistCategory> {
    return apiClient.patch<PlaylistCategory>(`/playlist/categories/${id}`, patch);
  }

  /**
   * Permanently delete a playlist category. Linked playlists are not deleted.
   * @param id - Category UUID.
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete<void>(`/playlist/categories/${id}`);
  }

  /**
   * Add a playlist to a category.
   * @param categoryId - Category UUID.
   * @param playlistId - Playlist UUID.
   */
  async addPlaylistToCategory(categoryId: string, playlistId: string): Promise<void> {
    await apiClient.post<void>(`/playlist/categories/${categoryId}/playlists/${playlistId}`, {});
  }

  /**
   * Remove a playlist from a category.
   * @param categoryId - Category UUID.
   * @param playlistId - Playlist UUID.
   */
  async removePlaylistFromCategory(categoryId: string, playlistId: string): Promise<void> {
    await apiClient.delete<void>(`/playlist/categories/${categoryId}/playlists/${playlistId}`);
  }
}

export const playlistApiClient = new PlaylistApiClient();
