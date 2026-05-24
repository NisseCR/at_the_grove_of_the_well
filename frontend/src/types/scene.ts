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

export interface BackgroundConfig {
  src: string;
  type: "video" | "image";
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
  type: "video" | "image";
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
