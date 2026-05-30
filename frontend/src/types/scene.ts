type BlendMode =
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

type FileType = "video" | "image";

interface SceneAsset {
  id: string;
  src: string;
  type: FileType;
  loop: boolean;
  opacity: number;
  brightness: number;
  grayscale: number;
  blur: number;
  flip: boolean;
  blend_mode: BlendMode;
}

export interface BackgroundAsset extends SceneAsset {}

export interface LayerAsset extends SceneAsset {
  order: number;
}

export interface SceneConfig {
  id: string;
  background: BackgroundAsset;
  layers: LayerAsset[];
}
