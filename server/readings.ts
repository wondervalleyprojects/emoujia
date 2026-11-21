// Asks Gemini for a reading. Both reading routes use this, in both servers.
import { GoogleGenAI } from '@google/genai';
import { GRID_PROMPT, threePrompt } from './prompts';
import { splitEmoji } from '../src/lib/grid';

// Tried in order until one answers. GEMINI_MODELS (comma separated) overrides
// the list without a code change. Google retires gemini-2.5-flash on 1 Dec 2026
// (requests route to gemini-3.5-flash-lite); the list after that is Japhy's
// call, [MODEL LIST AFTER 1 DEC], from the test in scripts/model-test.mjs.
export const MODELS = (process.env.GEMINI_MODELS || 'gemini-2.5-flash,gemini-3.5-flash')
  .split(',').map((m) => m.trim()).filter(Boolean);

export type OracleCode = 'resting' | 'oracle_error';
export class OracleError extends Error {
  constructor(message: string, public code: OracleCode) { super(message); }
}

const isQuota = (err: any) =>
  err?.status === 429 || err?.code === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(String(err?.message || ''));

// The model that actually answered, as Google names it in the response.
async function ask(parts: any[]): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new OracleError('Oracle connection failed: missing server key.', 'oracle_error');
  const ai = new GoogleGenAI({ apiKey });
  let quota = false;
  let last = '';
  for (const model of MODELS) {
    try {
      const r = await ai.models.generateContent({ model, contents: [{ role: 'user', parts }] });
      return { text: r.text || '', model: r.modelVersion || model };
    } catch (err: any) {
      // Status and Google's message only. Never the request.
      console.error(`[oracle] ${model} failed: ${err?.status ?? ''} ${String(err?.message || err).slice(0, 300)}`);
      if (isQuota(err)) quota = true;
      last = String(err?.message || err);
    }
  }
  if (quota) throw new OracleError('The free allowance is spent for today.', 'resting');
  throw new OracleError(last || 'No model answered.', 'oracle_error');
}

function parseJson(text: string): any {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').replace(/```\n?|\n?```/g, '').trim();
  try { return JSON.parse(cleaned); } catch { throw new OracleError('The oracle answered in a shape we could not read.', 'oracle_error'); }
}

const IMAGE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s_-]+)$/;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export class InputError extends Error {}

export async function readGrid(image: unknown) {
  if (typeof image !== 'string') throw new InputError('Send a screenshot.');
  const m = image.match(IMAGE);
  if (!m) throw new InputError('Send the screenshot as a JPEG, PNG or WebP image.');
  // Clean base64 of newlines, spaces and URL-safe letters, then pad to a multiple of 4.
  let data = m[2].trim().replace(/[\r\n]/g, '').replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
  const pad = data.length % 4;
  if (pad > 0) data += '='.repeat(4 - pad);
  if (data.length * 0.75 > MAX_IMAGE_BYTES) throw new InputError('That image is too large.');

  const { text, model } = await ask([{ text: GRID_PROMPT }, { inlineData: { mimeType: m[1], data } }]);
  const parsed = parseJson(text);
  if (!Array.isArray(parsed.emojis) || typeof parsed.reading !== 'string' || !parsed.reading.trim()) {
    throw new OracleError('The oracle returned an incomplete sequence.', 'oracle_error');
  }
  const emojis = splitEmoji(parsed.emojis.filter((e: unknown) => typeof e === 'string'));
  return { emojis, reading: parsed.reading.trim(), model };
}

export async function readThree(emojis: [string, string, string]) {
  const { text, model } = await ask([{ text: threePrompt(emojis) }]);
  const parsed = parseJson(text);
  if (typeof parsed.reading !== 'string' || !parsed.reading.trim()) {
    throw new OracleError('The oracle returned an incomplete sequence.', 'oracle_error');
  }
  return { emojis: [...emojis], reading: parsed.reading.trim(), model };
}
