import { PUBLIC_ASSETS_BASE } from '$env/static/public';

export const API_BASE = '/api';

/**
 * @param src - R2 asset key (relative path within the bucket).
 */
export function assetUrl(src: string): string {
  return `${PUBLIC_ASSETS_BASE}/${src}`;
}
