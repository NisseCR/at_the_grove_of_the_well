import type { ParsedReader, ReaderFrontmatter, ReaderSegment, ReaderTrigger } from "@/types/reader";

/**
 * Parse a block of `key: value` lines into a plain object.
 * Values of "none" on playlist fields are converted to null.
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

/** Parse YAML-like frontmatter block into a ReaderFrontmatter object. */
function parseFrontmatter(raw: string): ReaderFrontmatter {
  const kv = parseKeyValues(raw);
  const fm: ReaderFrontmatter = {};
  if (kv.title) fm.title = kv.title;
  if (kv.scene) fm.scene = kv.scene;
  if (kv.ambiences !== undefined) {
    fm.ambiences = kv.ambiences === "none" ? [] : kv.ambiences.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (kv.playlist !== undefined) {
    fm.playlist = kv.playlist === "none" ? null : kv.playlist;
  }
  return fm;
}

/** Parse a trigger comment body into a ReaderTrigger object. */
function parseTrigger(raw: string): ReaderTrigger {
  const kv = parseKeyValues(raw);
  const trigger: ReaderTrigger = {};
  if (kv.scene) trigger.scene = kv.scene;
  if (kv.ambiences !== undefined) {
    trigger.ambiences = kv.ambiences === "none" ? [] : kv.ambiences.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (kv.playlist !== undefined) {
    trigger.playlist = kv.playlist === "none" ? null : kv.playlist;
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
 * The content following each trigger comment becomes a segment associated
 * with that trigger. Triggers fire when the segment scrolls into view.
 */
export function parseReader(markdown: string): ParsedReader {
  let content = markdown;
  let frontmatter: ReaderFrontmatter = {};

  // Strip frontmatter block
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    frontmatter = parseFrontmatter(fmMatch[1]);
    content = content.slice(fmMatch[0].length);
  }

  // Split by trigger comments — capturing group preserves trigger body
  // parts: [text0, triggerBody1, text1, triggerBody2, text2, ...]
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
