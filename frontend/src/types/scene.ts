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

export interface BackgroundConfig {
  src: string;
  type: FileType;
  opacity: number;
  brightness: number;
  grayscale: number;
  blur: number;
  flip: boolean;
  blend_mode: BlendMode;
}

export interface LayerConfig {
  id: string;
  src: string;
  type: FileType;
  loop?: boolean;
  visible: boolean;
  order: number;
  opacity: number;
  brightness: number;
  grayscale: number;
  blur: number;
  flip: boolean;
  blend_mode: BlendMode;
}

export interface SceneConfig {
  id: string;
  name: string;
  background: BackgroundConfig;
  layers: LayerConfig[];
}
