const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const WS_BASE = `${wsProtocol}//${window.location.host}`;
export const API_BASE = '/api';
export const STATIC_BASE = '/static';

export function assetUrl(src: string): string {
  return `${STATIC_BASE}/${src}`;
}
