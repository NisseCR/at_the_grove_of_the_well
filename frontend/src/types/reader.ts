export interface AmbienceRef {
  id: string;
  volume: number;
}

export interface PlaylistRef {
  id: string;
  volume: number;
}

export interface ReaderFrontmatter {
  title?: string;
  scene?: string;
  /** Ambiences to activate with per-entry volume. Empty array means silence. */
  ambiences?: AmbienceRef[];
  /** Playlist to start with volume, null to stop music, undefined if not specified. */
  playlist?: PlaylistRef | null;
}

export interface ReaderTrigger {
  scene?: string;
  /** Ambiences to sync with per-entry volume. Empty array deactivates all. Undefined means no change. */
  ambiences?: AmbienceRef[];
  /** Playlist to start with volume, null to stop, undefined means no change. */
  playlist?: PlaylistRef | null;
}

export interface ReaderSegment {
  text: string;
  trigger?: ReaderTrigger;
}

export interface ParsedReader {
  frontmatter: ReaderFrontmatter;
  segments: ReaderSegment[];
}

export interface ReaderFile {
  slug: string;
  title: string;
}
