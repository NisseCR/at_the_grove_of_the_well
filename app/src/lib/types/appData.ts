import type { Ambience, AmbienceCategory } from './ambience';
import type { Playlist, PlaylistCategory } from './music';
import type { Scene, SceneCategory } from './scene';
import type { Story, ParsedChapter } from './story';

export interface AppData {
  ambience_categories: AmbienceCategory[];
  ambiences: Ambience[];
  playlist_categories: PlaylistCategory[];
  playlists: Playlist[];
  scene_categories: SceneCategory[];
  scenes: Scene[];
  stories: Story[];
  /** Parsed chapter content keyed by "storySlug/chapterSlug". */
  chapters: Record<string, ParsedChapter>;
  last_synced: string | null;
}
