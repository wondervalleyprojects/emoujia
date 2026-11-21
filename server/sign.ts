// Signs each reading when the server makes it, so /api/send-reading mails only
// readings this server wrote. Nothing is stored: the signature travels with the
// reading in the visitor's browser and is checked when it comes back.
//
// What a signature proves: this server wrote this reading text, for these
// emoji, at this time, in the last 24 hours. What it does not stop: the same
// reading mailed more than once inside that window (stopping that would mean
// keeping a list, which we do not). The share card is drawn in the browser and
// cannot be signed; the email route checks only that it is a small JPEG.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export type ReadingKind = 'grid' | 'three';
export const SIGNATURE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  if (process.env.READING_SECRET) return process.env.READING_SECRET;
  // Until READING_SECRET is set in Netlify, derive one from the Gemini key, so
  // the deploy preview works. Changing either key voids readings already made.
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No signing secret: set READING_SECRET or GEMINI_API_KEY.');
  return createHash('sha256').update(`emoujia-reading-signature:${key}`).digest('hex');
}

function mac(kind: ReadingKind, issuedAt: number, emojis: string[], reading: string): string {
  return createHmac('sha256', secret()).update(JSON.stringify(['emoujia/1', kind, issuedAt, emojis, reading])).digest('base64url');
}

export interface Signed { kind: ReadingKind; issuedAt: number; signature: string }

export function signReading(kind: ReadingKind, emojis: string[], reading: string, issuedAt = Date.now()): Signed {
  return { kind, issuedAt, signature: mac(kind, issuedAt, emojis, reading) };
}

export function verifyReading(input: { kind?: unknown; issuedAt?: unknown; emojis?: unknown; reading?: unknown; signature?: unknown }, now = Date.now()): boolean {
  const { kind, issuedAt, emojis, reading, signature } = input;
  if (kind !== 'grid' && kind !== 'three') return false;
  if (typeof issuedAt !== 'number' || !Number.isFinite(issuedAt)) return false;
  if (issuedAt > now + 60_000 || now - issuedAt > SIGNATURE_MAX_AGE_MS) return false;
  if (!Array.isArray(emojis) || !emojis.every((e) => typeof e === 'string')) return false;
  if (typeof reading !== 'string' || typeof signature !== 'string') return false;
  const want = Buffer.from(mac(kind, issuedAt, emojis as string[], reading));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}
