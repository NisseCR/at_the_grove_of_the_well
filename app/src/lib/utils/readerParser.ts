import type {
  AmbienceRef,
  ParsedReader,
  PlaylistRef,
  ReaderFrontmatter,
  ReaderSegment,
  ReaderTrigger,
} from "$lib/types/reader";
import { DEFAULT_AMBIENCE_VOLUME, DEFAULT_MUSIC_VOLUME } from "$lib/config/audio";

/**
 * Parse a block of `key: value` lines into a plain object.
 */
function parseKeyValues(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.trim().split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Parse a single ambience entry of the form `id` or `id@volume`.
 * Volume defaults to 1 when omitted.
 *
 * @param raw - A single ambience token, e.g. "wind.rustling@0.7".
 */
function parseAmbienceRef(raw: string): AmbienceRef {
  const atIdx = raw.indexOf("@");
  if (atIdx === -1) return { id: raw, volume: DEFAULT_AMBIENCE_VOLUME };
  return {
    id: raw.slice(0, atIdx),
    volume: parseFloat(raw.slice(atIdx + 1)) || 1,
  };
}

/**
 * Parse a playlist value of the form `id` or `id@volume`.
 * Returns null for "none". Volume defaults to 1 when omitted.
 *
 * @param raw - The raw playlist value string.
 */
function parsePlaylistRef(raw: string): PlaylistRef | null {
  if (raw === "none") return null;
  const atIdx = raw.indexOf("@");
  if (atIdx === -1) return { id: raw, volume: DEFAULT_MUSIC_VOLUME };
  return {
    id: raw.slice(0, atIdx),
    volume: parseFloat(raw.slice(atIdx + 1)) || 1,
  };
}

/** Parse YAML-like frontmatter block into a ReaderFrontmatter object. */
function parseFrontmatter(raw: string): ReaderFrontmatter {
  const kv = parseKeyValues(raw);
  const fm: ReaderFrontmatter = {};
  if (kv.title) fm.title = kv.title;
  if (kv.scene) fm.scene = kv.scene;
  if (kv.ambiences !== undefined) {
    fm.ambiences =
      kv.ambiences === "none"
        ? []
        : kv.ambiences
            .split(",")
            .map((s) => parseAmbienceRef(s.trim()))
            .filter((a) => a.id.length > 0);
  }
  if (kv.playlist !== undefined) {
    fm.playlist = parsePlaylistRef(kv.playlist);
  }
  return fm;
}

/** Parse a trigger comment body into a ReaderTrigger object. */
function parseTrigger(raw: string): ReaderTrigger {
  const kv = parseKeyValues(raw);
  const trigger: ReaderTrigger = {};
  if (kv.scene) trigger.scene = kv.scene;
  if (kv.ambiences !== undefined) {
    trigger.ambiences =
      kv.ambiences === "none"
        ? []
        : kv.ambiences
            .split(",")
            .map((s) => parseAmbienceRef(s.trim()))
            .filter((a) => a.id.length > 0);
  }
  if (kv.playlist !== undefined) {
    trigger.playlist = parsePlaylistRef(kv.playlist);
  }
  return trigger;
}

/**
 * Parse a reader markdown file into structured frontmatter and segments.
 *
 * Trigger comments take the form:
 *   <!-- trigger
 *   key: value
 *   -->
 *
 * Ambience entries support optional volume via `@`: `wind.rustling@0.7`.
 * Playlist entries support optional volume via `@`: `australis@0.8`.
 * Volume defaults to 1 when omitted.
 */
export function parseReader(markdown: string): ParsedReader {
  let content = markdown;
  let frontmatter: ReaderFrontmatter = {};

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    frontmatter = parseFrontmatter(fmMatch[1]);
    content = content.slice(fmMatch[0].length);
  }

  const parts = content.split(/<!--\s*trigger\s*\n([\s\S]*?)-->/);
  const segments: ReaderSegment[] = [];

  const leadText = parts[0].trim();
  if (leadText) segments.push({ text: leadText });

  for (let i = 1; i < parts.length; i += 2) {
    const trigger = parseTrigger(parts[i]);
    const text = (parts[i + 1] ?? "").trim();
    segments.push({ text, trigger });
  }

  return { frontmatter, segments };
}
