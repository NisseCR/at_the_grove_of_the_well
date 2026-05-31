export const SERVER = import.meta.env.VITE_SERVER ?? "localhost:8000";
export const API_BASE = `http://${SERVER}`;
export const STATIC_BASE = `${API_BASE}/static`;

export function assetUrl(src: string): string {
  return `${STATIC_BASE}/${src}`;
}
