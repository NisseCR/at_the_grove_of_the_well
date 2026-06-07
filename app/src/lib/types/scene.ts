export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

interface SceneAsset {
  id: string;
  src: string;
  url?: string;
  type: "image" | "video";
  loop: boolean;
  opacity: number;
  brightness: number;
  grayscale: number;
  blur: number;
  flip: boolean;
  blend_mode: BlendMode;
}

export interface BackgroundAsset extends SceneAsset {
  thumb_src: string | null;
  thumb_url?: string | null;
}

export interface LayerAsset extends SceneAsset {
  order: number;
}

export interface Scene {
  id: string;
  label: string;
  background: BackgroundAsset;
  layers: LayerAsset[];
}

export interface SceneCategoryEntry {
  id: string;
  label: string;
}

export interface SceneCategory {
  id: string;
  label: string;
  order: number;
  scenes: SceneCategoryEntry[];
}

/** Minimum shape required by sceneEngine. Both sceneState and readerState satisfy this. */
export interface SceneSlotState {
  current: Scene | null;
  next: Scene | null;
  isTransitioning: boolean;
}

// ---------------------------------------------------------------------------
// Scene JSON config — shape of files stored in R2 at scenes/{cat}/{scene}.json
// ---------------------------------------------------------------------------

interface SceneAssetConfig {
  src: string;
  type?: "image" | "video";
  loop?: boolean;
  opacity?: number;
  brightness?: number;
  grayscale?: number;
  blur?: number;
  flip?: boolean;
  blend_mode?: BlendMode;
}

export interface BackgroundConfig extends SceneAssetConfig {
  thumb_src?: string | null;
}

export interface LayerConfig extends SceneAssetConfig {}

/** Shape of a scene JSON file. Category is implicit from the R2 folder structure. */
export interface SceneConfig {
  id?: string;
  label?: string;
  background: BackgroundConfig;
  layers?: LayerConfig[];
}
