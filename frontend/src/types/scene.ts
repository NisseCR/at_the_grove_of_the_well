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
  slug: string | null;
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

// ---------------------------------------------------------------------------
// Editor-specific types
// ---------------------------------------------------------------------------

export interface LayerProperties {
  loop: boolean;
  opacity: number;
  brightness: number;
  grayscale: number;
  blur: number;
  flip: boolean;
  blend_mode: BlendMode;
}

export interface BackgroundEditor extends LayerProperties {
  asset_id: string | null;
  label: string | null;
  type: "image" | "video" | null;
  thumb_src: string | null;
  thumb_url?: string | null;
}

export interface LayerEditor extends LayerProperties {
  layer_id: string;
  asset_id: string;
  label: string;
  type: "image" | "video";
  order: number;
  url?: string;
}

export interface SceneEditor {
  id: string;
  slug: string | null;
  label: string;
  background: BackgroundEditor;
  layers: LayerEditor[];
}
