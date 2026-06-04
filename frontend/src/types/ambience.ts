export interface AmbienceAsset {
  id: string;
  src: string;
  url?: string;
}

export interface AmbienceConfig {
  id: string;
  ambiences: AmbienceAsset[];
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
