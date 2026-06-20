const COLORS: Record<string, string> = {
  "audio:engine": "color: #7dd3fc; font-weight: bold",
  "audio:ambience": "color: #86efac; font-weight: bold",
};

const DEFAULT_COLOR = "color: #a78bfa; font-weight: bold";

export function createLogger(scope: string) {
  const style = COLORS[scope] ?? DEFAULT_COLOR;
  const prefix = `%c[${scope}]`;
  return {
    debug: (...args: unknown[]) => console.log(prefix, style, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, style, ...args),
    error: (...args: unknown[]) => console.error(prefix, style, ...args),
  };
}
