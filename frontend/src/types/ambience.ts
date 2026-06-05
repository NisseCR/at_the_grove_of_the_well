export interface Ambience {
  id: string;
  slug: string | null;
  label: string;
  volume: number;
  loop: boolean;
  src: string;
  url?: string;
  /** Populated for editor use only — null when no audio is linked. */
  audio_asset_id: string | null;
  audio_asset_label: string | null;
}

export interface AmbienceCategoryEntry {
  id: string;
  label: string;
}

export interface AmbienceCategory {
  id: string;
  label: string;
  src: string;
  thumb_src: string | null;
  url?: string;
  thumb_url?: string | null;
  order: number;
  ambiences: AmbienceCategoryEntry[];
}
