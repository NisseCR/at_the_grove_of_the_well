/**
 * R2 folder scanner. Builds in-memory AppData from the bucket folder structure.
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
 *   scenes/{category-slug}/{scene-slug}.json
 *
 * Slugs (filename stems) are used as stable entity IDs and must be globally
 * unique within their type.
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
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
// R2 client
// ---------------------------------------------------------------------------

function createClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY,
      secretAccessKey: env.R2_SECRET_KEY,
    },
  });
}

/** Return every object key in the bucket, handling pagination. */
async function listR2Keys(client: S3Client): Promise<string[]> {
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
// Scenes — fetched from R2 at scenes/{category-slug}/{scene-slug}.json
// ---------------------------------------------------------------------------

/** Fetch and parse scene JSON configs from R2, building scene + category structures. */
async function scanScenes(
  keys: string[],
  client: S3Client,
): Promise<{ categories: SceneCategory[]; scenes: Scene[] }> {
  const sceneKeys = keys.filter((k) => {
    const parts = k.split("/");
    return (
      parts.length === 3 && parts[0] === "scenes" && parts[2].endsWith(".json")
    );
  });

  const scenes: Scene[] = [];
  const catScenes = new Map<string, SceneCategoryEntry[]>();

  for (const key of sceneKeys) {
    const [, catSlug, filename] = key.split("/");
    const sceneSlug = filename.slice(0, -5);

    try {
      const res = await client.send(
        new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
      );
      const body = await res.Body?.transformToString();
      if (!body) continue;

      const raw = JSON.parse(body) as Record<string, unknown>;
      const sceneId = (raw.id as string | undefined) ?? sceneSlug;

      const bg = (raw.background as Record<string, unknown> | undefined) ?? {};
      const bgSrc = (bg.src as string | undefined) ?? "";
      const bgThumbSrc = (bg.thumb_src as string | null | undefined) ?? null;

      const background: BackgroundAsset = {
        id: bgSrc
          ? bgSrc.split("/").pop()!.replace(/\.[^.]+$/, "")
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
            ? lSrc.split("/").pop()!.replace(/\.[^.]+$/, "")
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

      const label = (raw.label as string | undefined) ?? toLabel(sceneSlug);
      scenes.push({ id: sceneId, label, background, layers });

      if (!catScenes.has(catSlug)) catScenes.set(catSlug, []);
      catScenes.get(catSlug)!.push({ id: sceneId, label });
    } catch (err) {
      console.warn(`Skipped scene ${key}:`, err);
    }
  }

  const categories: SceneCategory[] = [...catScenes.entries()]
    .sort((a, b) => toOrder(a[0]) - toOrder(b[0]))
    .map(([catSlug, entries]) => ({
      id: toBase(catSlug),
      label: toLabel(catSlug),
      order: toOrder(catSlug),
      scenes: entries,
    }));

  return { categories, scenes };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Scan R2 for all assets and scene configs, return a fully populated AppData snapshot. */
export async function scan(): Promise<AppData> {
  console.log("Starting R2 scan...");
  const client = createClient();
  const keys = await listR2Keys(client);
  console.log(`Found ${keys.length} objects in R2`);

  const { categories: ambienceCategories, ambiences } = scanAmbiences(keys);
  const { categories: playlistCategories, playlists } = scanPlaylists(keys);
  const { categories: sceneCategories, scenes } = await scanScenes(keys, client);

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
