/**
 * Formats a duration in seconds as a human-readable M:SS string.
 * Returns "—" if duration is null or undefined.
 *
 * @param seconds - Duration in seconds.
 * @returns Formatted string e.g. "3:07", "1:02:45", or "—".
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");

  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Derives a display label from a filename by stripping the extension.
 *
 * @param filename - Full filename e.g. "forest-day.mp3".
 * @returns Label without extension e.g. "forest-day".
 */
export function labelFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}
