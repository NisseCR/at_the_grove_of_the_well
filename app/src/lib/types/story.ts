/** Index entry for a single chapter — built by scanner, stored in AppData. */
export interface StoryChapter {
  slug: string;
  title: string;
}

/** Index entry for a story — built by scanner, stored in AppData. */
export interface Story {
  slug: string;
  label: string;
  chapters: StoryChapter[];
}

/** Reference to an audio asset with a per-trigger volume override. */
export interface AudioRef {
  id: string;
  volume: number;
}

/** Parsed frontmatter from a chapter markdown file. */
export interface ChapterFrontmatter {
  title: string;
  scene: string;
  /** Ambiences active at chapter start. Null means silence. */
  ambiences: AudioRef[] | null;
  /** Playlist active at chapter start. Null means no music. */
  playlist: AudioRef | null;
}

/**
 * Full audio state snapshot attached to a scroll position.
 * Always carries both fields so any trigger can be applied in isolation
 * regardless of scroll direction or speed.
 */
export interface ChapterTrigger {
  /** Ambiences active at this point. Null means silence. */
  ambiences: AudioRef[] | null;
  /** Playlist active at this point. Null means no music. */
  playlist: AudioRef | null;
}

/** One prose block between two triggers (or the start/end of the chapter). */
export interface ChapterSegment {
  html: string;
  trigger?: ChapterTrigger;
}

/** Full parsed chapter returned by the chapter API route. */
export interface ParsedChapter {
  frontmatter: ChapterFrontmatter;
  segments: ChapterSegment[];
}
