export interface MusicTrack {
  id: string;
  src: string;
  url?: string;
}

export interface Playlist {
  id: string;
  src: string;
  tracks: MusicTrack[];
  url?: string;
}

export interface PlaylistCategoryEntry {
  id: string;
  label: string;
}

export interface PlaylistCategory {
  id: string;
  order: number;
  playlists: PlaylistCategoryEntry[];
}
