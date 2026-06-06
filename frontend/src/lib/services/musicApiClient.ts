import { assetUrl } from "$lib/config";
import { apiClient } from "$lib/services/apiClient";
import type { Playlist, PlaylistCategory } from "$lib/types/music";

class MusicApiClient {
  private withUrl(playlist: Playlist): Playlist {
    return {
      ...playlist,
      url: assetUrl(playlist.src),
      thumb_url: playlist.thumb_src ? assetUrl(playlist.thumb_src) : null,
      tracks: playlist.tracks.map((t) => ({ ...t, url: assetUrl(t.src) })),
    };
  }

  async fetchPlaylistCategories(): Promise<PlaylistCategory[]> {
    return apiClient.get<PlaylistCategory[]>("/music/playlist/categories");
  }

  async fetchPlaylists(): Promise<Playlist[]> {
    const playlists = await apiClient.get<Playlist[]>("/music/playlist");
    return playlists.map((p) => this.withUrl(p));
  }

  async fetchPlaylist(id: string): Promise<Playlist> {
    const playlist = await apiClient.get<Playlist>(`/music/playlist/${id}`);
    return this.withUrl(playlist);
  }
}

export const musicApiClient = new MusicApiClient();
