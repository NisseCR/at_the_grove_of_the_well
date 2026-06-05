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
