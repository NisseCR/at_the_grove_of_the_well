export interface Ambience {
  id: string;
  slug: string | null;
  label: string;
  volume: number;
  loop: boolean;
  src: string;
  url?: string;
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
