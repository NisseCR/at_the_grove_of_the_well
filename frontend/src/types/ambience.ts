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
  src: string;
  url?: string;
  order: number;
  ambiences: AmbienceCategoryEntry[];
}
