/**
 * R2 folder scanner. Builds in-memory AppData from the bucket folder structure
 * and scene JSON configs bundled at build time.
 *
 * R2 folder conventions:
 *   ambiences/{category-slug}/{ambience-slug}.ogg
 *   ambiences/{category-slug}/cover.webp
 *   ambiences/{category-slug}/cover.thumb.webp
 *
 *   playlists/{category-slug}/{playlist-slug}/{track-slug}.ogg
 *   playlists/{category-slug}/{playlist-slug}/cover.webp
 *   playlists/{category-slug}/{playlist-slug}/cover.thumb.webp
 *
 * Scene configs live in src/data/scenes/ as JSON files (not in R2).
 * Ambience and playlist slugs (filename stems) are used as stable entity IDs
 * and must be globally unique within their type.
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { PUBLIC_ASSETS_BASE } from "$env/static/public";
import type {
  Ambience,
  AmbienceCategory,
  AmbienceCategoryEntry,
} from "$lib/types/ambience";
import type {
  MusicTrack,
  Playlist,
  PlaylistCategory,
  PlaylistCategoryEntry,
} from "$lib/types/music";
import type {
  BlendMode,
  BackgroundAsset,
  LayerAsset,
  Scene,
  SceneCategory,
  SceneCategoryEntry,
} from "$lib/types/scene";
import type { AppData } from "$lib/types/appData";

/** Build a full CDN URL from a raw R2 object key. */
function assetUrl(src: string): string {
  return `${PUBLIC_ASSETS_BASE}/${src}`;
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

/** Strip leading numeric prefix and convert hyphens to title-cased words. */
function toLabel(slug: string): string {
  return slug
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Strip leading numeric prefix, keeping hyphens. Used for stable IDs. */
function toBase(slug: string): string {
  return slug.replace(/^\d+-/, "");
}

/** Return the leading numeric prefix of a slug as a sort key, 999 if absent. */
function toOrder(slug: string): number {
  const m = slug.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : 999;
}

// ---------------------------------------------------------------------------
// R2 listing
// ---------------------------------------------------------------------------

/** Return every object key in the bucket, handling pagination. */
async function listR2Keys(): Promise<string[]> {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY,
      secretAccessKey: env.R2_SECRET_KEY,
    },
  });

  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of res.Contents ?? []) if (obj.Key) keys.push(obj.Key);
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

// ---------------------------------------------------------------------------
// Ambiences
// ---------------------------------------------------------------------------

/** Build ambience categories and a flat ambience list from R2 keys. */
function scanAmbiences(keys: string[]): {
  categories: AmbienceCategory[];
  ambiences: Ambience[];
} {
  const cats = new Map<string, { src: string; thumb_src: string | null }>();
  const ambiences = new Map<string, Ambience>();
  const catAmbs = new Map<string, string[]>();

  for (const key of keys) {
    const parts = key.split("/");
    if (parts.length !== 3 || parts[0] !== "ambiences") continue;
    const [, catSlug, filename] = parts;

    if (!cats.has(catSlug)) cats.set(catSlug, { src: "", thumb_src: null });

    if (filename === "cover.webp") {
      cats.get(catSlug)!.src = key;
    } else if (filename === "cover.thumb.webp") {
      cats.get(catSlug)!.thumb_src = key;
    } else if (filename.endsWith(".ogg")) {
      const ambSlug = filename.slice(0, -4);
      const id = `${toBase(catSlug)}.${ambSlug}`;
      if (ambiences.has(id)) {
        console.warn(
          `Duplicate ambience '${ambSlug}' in '${catSlug}' — skipping`,
        );
        continue;
      }
      ambiences.set(id, {
        id,
        label: toLabel(ambSlug),
        loop: true,
        src: key,
        url: assetUrl(key),
      });
      if (!catAmbs.has(catSlug)) catAmbs.set(catSlug, []);
      catAmbs.get(catSlug)!.push(ambSlug);
    }
  }

  const categories: AmbienceCategory[] = [...cats.entries()]
    .sort((a, b) => toOrder(a[0]) - toOrder(b[0]))
    .map(([catSlug, meta]) => {
      const catBase = toBase(catSlug);
      const entries: AmbienceCategoryEntry[] = (catAmbs.get(catSlug) ?? [])
        .sort()
        .map((slug) => ({ id: `${catBase}.${slug}`, label: toLabel(slug) }));
      return {
        id: toBase(catSlug),
        label: toLabel(catSlug),
        src: meta.src,
        thumb_src: meta.thumb_src,
        url: assetUrl(meta.src),
        thumb_url: meta.thumb_src ? assetUrl(meta.thumb_src) : null,
        order: toOrder(catSlug),
        ambiences: entries,
      };
    });

  return { categories, ambiences: [...ambiences.values()] };
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

/** Build playlist categories and full playlist objects from R2 keys. */
function scanPlaylists(keys: string[]): {
  categories: PlaylistCategory[];
  playlists: Playlist[];
} {
  const cats = new Set<string>();
  const plData = new Map<
    string,
    { src: string; thumb_src: string | null; tracks: MusicTrack[] }
  >();

  for (const key of keys) {
    const parts = key.split("/");
    if (parts.length !== 4 || parts[0] !== "playlists") continue;
    const [, catSlug, plSlug, filename] = parts;

    cats.add(catSlug);
    const plKey = `${catSlug}/${plSlug}`;
    if (!plData.has(plKey))
      plData.set(plKey, { src: "", thumb_src: null, tracks: [] });

    const pl = plData.get(plKey)!;
    if (filename === "cover.webp") pl.src = key;
    else if (filename === "cover.thumb.webp") pl.thumb_src = key;
    else if (filename.endsWith(".ogg"))
      pl.tracks.push({ id: filename.slice(0, -4), src: key });
  }

  for (const pl of plData.values())
    pl.tracks.sort((a, b) => a.src.localeCompare(b.src));

  const catEntries = new Map<string, PlaylistCategoryEntry[]>();
  for (const cat of cats) catEntries.set(cat, []);

  const playlists: Playlist[] = [];
  for (const [plKey, meta] of [...plData.entries()].sort()) {
    const slash = plKey.indexOf("/");
    const catSlug = plKey.slice(0, slash);
    const plSlug = plKey.slice(slash + 1);
    playlists.push({
      id: plSlug,
      label: toLabel(plSlug),
      src: meta.src,
      thumb_src: meta.thumb_src,
      url: assetUrl(meta.src),
      thumb_url: meta.thumb_src ? assetUrl(meta.thumb_src) : null,
      tracks: meta.tracks.map((t) => ({ ...t, url: assetUrl(t.src) })),
    });
    catEntries.get(catSlug)!.push({ id: plSlug, label: toLabel(plSlug) });
  }

  const categories: PlaylistCategory[] = [...cats]
    .sort((a, b) => toOrder(a) - toOrder(b))
    .map((catSlug) => ({
      id: toBase(catSlug),
      label: toLabel(catSlug),
      order: toOrder(catSlug),
      playlists: catEntries.get(catSlug) ?? [],
    }));

  return { categories, playlists };
}

// ---------------------------------------------------------------------------
// Scenes — bundled at build time (scene configs are code, not runtime data)
// ---------------------------------------------------------------------------

const sceneModules = import.meta.glob("../../data/scenes/*.json", {
  eager: true,
});

/** Read scene JSON configs bundled at build time and build scene + category structures. */
function scanScenes(): { categories: SceneCategory[]; scenes: Scene[] } {
  const scenes: Scene[] = [];
  const catScenes = new Map<string, SceneCategoryEntry[]>();

  for (const [path, mod] of Object.entries(sceneModules)) {
    try {
      const raw = (mod as { default: Record<string, unknown> }).default;
      const sceneId =
        (raw.id as string | undefined) ??
        path.split("/").pop()!.replace(".json", "");
      const category = (raw.category as string | undefined) ?? "uncategorized";

      const bg = (raw.background as Record<string, unknown> | undefined) ?? {};
      const bgSrc = (bg.src as string | undefined) ?? "";

      const bgThumbSrc = (bg.thumb_src as string | null | undefined) ?? null;
      const background: BackgroundAsset = {
        id: bgSrc
          ? bgSrc
              .split("/")
              .pop()!
              .replace(/\.[^.]+$/, "")
          : sceneId,
        src: bgSrc,
        type: (bg.type as "image" | "video" | undefined) ?? "image",
        thumb_src: bgThumbSrc,
        url: bgSrc ? assetUrl(bgSrc) : undefined,
        thumb_url: bgThumbSrc ? assetUrl(bgThumbSrc) : null,
        loop: (bg.loop as boolean | undefined) ?? true,
        opacity: (bg.opacity as number | undefined) ?? 1.0,
        brightness: (bg.brightness as number | undefined) ?? 1.0,
        grayscale: (bg.grayscale as number | undefined) ?? 0.0,
        blur: (bg.blur as number | undefined) ?? 0.0,
        flip: (bg.flip as boolean | undefined) ?? false,
        blend_mode: (bg.blend_mode as BlendMode | undefined) ?? "normal",
      };

      const layers: LayerAsset[] = (
        (raw.layers as unknown[] | undefined) ?? []
      ).map((lr, i) => {
        const l = lr as Record<string, unknown>;
        const lSrc = (l.src as string | undefined) ?? "";
        return {
          id: lSrc
            ? lSrc
                .split("/")
                .pop()!
                .replace(/\.[^.]+$/, "")
            : `${sceneId}-layer-${i}`,
          src: lSrc,
          url: lSrc ? assetUrl(lSrc) : undefined,
          type: (l.type as "image" | "video" | undefined) ?? "video",
          order: i,
          loop: (l.loop as boolean | undefined) ?? true,
          opacity: (l.opacity as number | undefined) ?? 1.0,
          brightness: (l.brightness as number | undefined) ?? 1.0,
          grayscale: (l.grayscale as number | undefined) ?? 0.0,
          blur: (l.blur as number | undefined) ?? 0.0,
          flip: (l.flip as boolean | undefined) ?? false,
          blend_mode: (l.blend_mode as BlendMode | undefined) ?? "normal",
        };
      });

      scenes.push({
        id: sceneId,
        label: (raw.label as string | undefined) ?? toLabel(sceneId),
        background,
        layers,
      });
      if (!catScenes.has(category)) catScenes.set(category, []);
      catScenes
        .get(category)!
        .push({ id: sceneId, label: scenes.at(-1)!.label });
    } catch (err) {
      console.warn(`Skipped scene ${path}:`, err);
    }
  }

  const categories: SceneCategory[] = [...catScenes.entries()]
    .sort((a, b) => toOrder(a[0]) - toOrder(b[0]))
    .map(([cat, entries]) => ({
      id: cat,
      label: toLabel(cat),
      order: toOrder(cat),
      scenes: entries,
    }));

  return { categories, scenes };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Scan R2 and read bundled scene configs, return a fully populated AppData snapshot. */
export async function scan(): Promise<AppData> {
  console.log("Starting R2 scan...");
  const keys = await listR2Keys();
  console.log(`Found ${keys.length} objects in R2`);

  const { categories: ambienceCategories, ambiences } = scanAmbiences(keys);
  const { categories: playlistCategories, playlists } = scanPlaylists(keys);
  const { categories: sceneCategories, scenes } = scanScenes();

  console.log(
    `Scan complete — ${ambienceCategories.length} ambience categories, ${ambiences.length} ambiences, ` +
      `${playlistCategories.length} playlist categories, ${playlists.length} playlists, ` +
      `${sceneCategories.length} scene categories, ${scenes.length} scenes`,
  );

  return {
    ambience_categories: ambienceCategories,
    ambiences,
    playlist_categories: playlistCategories,
    playlists,
    scene_categories: sceneCategories,
    scenes,
    last_synced: new Date().toISOString(),
  };
}
