export interface MusicTrack {
  id: string;
  src: string;
  url?: string;
}

export interface Playlist {
  id: string;
  slug: string | null;
  label: string;
  volume: number;
  src: string;
  thumb_src: string | null;
  tracks: MusicTrack[];
  url?: string;
  thumb_url?: string | null;
}

export interface PlaylistCategoryEntry {
  id: string;
  label: string;
}

export interface PlaylistCategory {
  id: string;
  label: string;
  order: number;
  playlists: PlaylistCategoryEntry[];
}

// ---------------------------------------------------------------------------
// Editor-specific types (richer than the music engine types above)
// ---------------------------------------------------------------------------

export interface PlaylistTrackEditor {
  audio_asset_id: string;
  label: string;
  src: string;
  url?: string;
}

export interface PlaylistEditor {
  id: string;
  slug: string | null;
  label: string;
  volume: number;
  src: string;
  thumb_src: string | null;
  cover_id: string | null;
  tracks: PlaylistTrackEditor[];
  url?: string;
  thumb_url?: string | null;
}
