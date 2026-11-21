// The browser side of the API. `api` is the base the mount names in data-api
// (for example /lab/emoujia/api on the studio site, /api on emoujia.com).
export type Kind = 'grid' | 'three';
export interface Reading { kind: Kind; emojis: string[]; reading: string; model: string; issuedAt: number; signature: string }

export class RestingError extends Error {}   // Google's free allowance is spent
export class TooManyError extends Error {}   // Netlify's per-visitor cap
export class RefusedError extends Error {}   // the server refused the input

async function post(url: string, body: unknown): Promise<any> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
  let j: any = null;
  try { j = await r.json(); } catch { /* Netlify's own 429 is not JSON */ }
  if (r.ok) return j;
  if (r.status === 429) throw j?.code === 'resting' ? new RestingError(j.error) : new TooManyError('Too many requests');
  if (r.status === 400 || r.status === 403 || r.status === 413) throw new RefusedError(j?.error || `Status ${r.status}`);
  throw new Error(j?.error || `Status ${r.status}`);
}

function asReading(j: any): Reading {
  if (!j || !Array.isArray(j.emojis) || typeof j.reading !== 'string') throw new Error('The oracle returned an incomplete reading.');
  return j as Reading;
}

export const readGrid = async (api: string, image: string) => asReading(await post(`${api}/analyze`, { image }));
export const readThree = async (api: string, emojis: string[]) => asReading(await post(`${api}/read-three`, { emojis }));
export const sendReading = (api: string, r: Reading, email: string, optIn: boolean, card: string | null) =>
  post(`${api}/send-reading`, { email, optIn, kind: r.kind, emojis: r.emojis, reading: r.reading, issuedAt: r.issuedAt, signature: r.signature, card });
