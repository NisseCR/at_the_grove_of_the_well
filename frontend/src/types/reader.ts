export interface ReaderFrontmatter {
  title?: string;
  scene?: string;
  /** Ambience IDs to activate. Empty array means silence. */
  ambiences?: string[];
  /** Playlist ID, or null to stop music, or undefined if not specified. */
  playlist?: string | null;
}

export interface ReaderTrigger {
  scene?: string;
  /** Ambiences to sync. Empty array deactivates all. Undefined means no change. */
  ambiences?: string[];
  /** Playlist ID, null to stop, undefined means no change. */
  playlist?: string | null;
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
