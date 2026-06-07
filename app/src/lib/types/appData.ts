import type { Ambience, AmbienceCategory } from './ambience';
import type { Playlist, PlaylistCategory } from './music';
import type { Scene, SceneCategory } from './scene';
import type { Story } from './story';

export interface AppData {
  ambience_categories: AmbienceCategory[];
  ambiences: Ambience[];
  playlist_categories: PlaylistCategory[];
  playlists: Playlist[];
  scene_categories: SceneCategory[];
  scenes: Scene[];
  stories: Story[];
  last_synced: string | null;
}
