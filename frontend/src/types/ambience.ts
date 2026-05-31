export interface AmbienceAsset {
  id: string;
  src: string;
}

export interface AmbienceConfig {
  id: string;
  ambiences: AmbienceAsset[];
}

export interface AmbienceCategory {
  id: string;
  src: string;
  order: number;
  ambience_ids: string[];
}
