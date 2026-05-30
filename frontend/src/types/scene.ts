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

interface AssetConfig {
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

export interface BackgroundConfig extends AssetConfig {}

export interface LayerConfig extends AssetConfig {
  order: number;
}

export interface SceneConfig {
  id: string;
  name: string;
  background: BackgroundConfig;
  layers: LayerConfig[];
}
