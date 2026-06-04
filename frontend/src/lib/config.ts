const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const WS_BASE = `${wsProtocol}//${window.location.host}`;
export const API_BASE = '/api';
export const ASSETS_BASE = import.meta.env.VITE_ASSETS_BASE as string;

export function assetUrl(src: string): string {
  return `${ASSETS_BASE}/${src}`;
}
