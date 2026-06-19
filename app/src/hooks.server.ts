import type { Handle } from '@sveltejs/kit';
import { load } from '$lib/server/appData';

// Run initial R2 scan on server start. Server starts with empty data if scan fails.
load().catch(err => console.error('Initial R2 scan failed:', err));

export const handle: Handle = async ({ event, resolve }) => resolve(event);
