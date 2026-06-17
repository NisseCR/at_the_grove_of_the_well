import { PUBLIC_ASSETS_BASE } from "$env/static/public";
import type {
  Scene,
  SceneConfig,
  BackgroundAsset,
  LayerAsset,
  BlendMode,
} from "$lib/types/scene";

function assetUrl(src: string): string {
  return `${PUBLIC_ASSETS_BASE}/${src}`;
}

/**
 * Convert a source-format SceneConfig to a fully resolved Scene.
 * Mirrors the default-application logic in scanner.ts so the builder
 * preview is identical to what the app renders after sync.
 */
export function configToScene(config: SceneConfig): Scene {
  const sceneId = config.id ?? "preview";
  const bg = config.background;
  const bgSrc = bg.src ?? "";
  const bgThumbSrc = bg.thumb_src ?? null;

  const background: BackgroundAsset = {
    id: bgSrc ? bgSrc.split("/").pop()!.replace(/\.[^.]+$/, "") : sceneId,
    src: bgSrc,
    type: bg.type ?? "image",
    thumb_src: bgThumbSrc,
    url: bgSrc ? assetUrl(bgSrc) : undefined,
    thumb_url: bgThumbSrc ? assetUrl(bgThumbSrc) : null,
    loop: bg.loop ?? true,
    opacity: bg.opacity ?? 1.0,
    brightness: bg.brightness ?? 1.0,
    grayscale: bg.grayscale ?? 0.0,
    blur: bg.blur ?? 0.0,
    flip: bg.flip ?? false,
    blend_mode: (bg.blend_mode as BlendMode) ?? "normal",
  };

  const layers: LayerAsset[] = (config.layers ?? []).map((l, i) => {
    const lSrc = l.src ?? "";
    return {
      id: lSrc
        ? lSrc
            .split("/")
            .pop()!
            .replace(/\.[^.]+$/, "")
        : `${sceneId}-layer-${i}`,
      src: lSrc,
      url: lSrc ? assetUrl(lSrc) : undefined,
      type: (l.type as "image" | "video") ?? "video",
      order: i,
      loop: l.loop ?? true,
      opacity: l.opacity ?? 1.0,
      brightness: l.brightness ?? 1.0,
      grayscale: l.grayscale ?? 0.0,
      blur: l.blur ?? 0.0,
      flip: l.flip ?? false,
      blend_mode: (l.blend_mode as BlendMode) ?? "normal",
    };
  });

  return { id: sceneId, label: config.label ?? sceneId, background, layers };
}

/**
 * Convert a resolved Scene back to source-format SceneConfig.
 * Used to load an existing scene into the builder as a starting point.
 * All fields are included so every knob is visible for editing.
 */
export function sceneToConfig(scene: Scene): SceneConfig {
  return {
    id: scene.id,
    label: scene.label,
    background: {
      src: scene.background.src,
      type: scene.background.type,
      thumb_src: scene.background.thumb_src,
      loop: scene.background.loop,
      opacity: scene.background.opacity,
      brightness: scene.background.brightness,
      grayscale: scene.background.grayscale,
      blur: scene.background.blur,
      flip: scene.background.flip,
      blend_mode: scene.background.blend_mode,
    },
    layers: [...scene.layers]
      .sort((a, b) => a.order - b.order)
      .map((l) => ({
        src: l.src,
        type: l.type,
        loop: l.loop,
        opacity: l.opacity,
        brightness: l.brightness,
        grayscale: l.grayscale,
        blur: l.blur,
        flip: l.flip,
        blend_mode: l.blend_mode,
      })),
  };
}
