export interface Handout {
  id: string;
  label: string;
  src: string;
  thumb_src: string | null;
  url?: string;
  thumb_url?: string | null;
}

export interface HandoutCategoryEntry {
  id: string;
  label: string;
}

export interface HandoutCategory {
  id: string;
  label: string;
  order: number;
  handouts: HandoutCategoryEntry[];
}
