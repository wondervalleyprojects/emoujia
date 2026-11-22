// Asks the model for a reading. Both reading routes use this, in both servers.
// A model named claude-* goes to Anthropic; anything else goes to Google.
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { GRID_PROMPT, threePrompt } from './prompts';
import { splitEmoji } from '../src/lib/grid';

// Tried in order until one answers. READING_MODELS (comma separated; the older
// name GEMINI_MODELS is still read) overrides the list without a code change,
// and may mix the two companies: "claude-haiku-5-5,gemini-3.5-flash-lite".
// The default is Japhy's choice of 21 Nov 2026, from the test in
// scripts/model-test.ts: Claude Sonnet 5.5 and nothing else, so no reading
// goes to Google. When the prepaid credit or the spending limit is used up,
// the page says the oracle is resting. Without ANTHROPIC_API_KEY no reading
// can be made.
export const MODELS = (process.env.READING_MODELS || process.env.GEMINI_MODELS || 'claude-sonnet-5-5')
  .split(',').map((m) => m.trim()).filter(Boolean);

export const isClaude = (model: string) => /^claude-/.test(model);

export type OracleCode = 'resting' | 'busy' | 'oracle_error';
export class OracleError extends Error {
  constructor(message: string, public code: OracleCode) { super(message); }
}

// What the page sends: the prompt, and for a screenshot reading, one image.
type Ask = { prompt: string; image?: { mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } };

// "Resting" means the money is used up: Anthropic's 402 (billing), the 400 it
// sends when a self-set spending limit or the prepaid credit runs out, and the
// 429 it marks enforced_spend_limit_reached. For a Gemini model, Google's 429.
// "Busy" is Anthropic's ordinary 429: too many requests this minute. It clears
// by itself, so the page says "One at a time" and not that the oracle rests.
const SPENT = /usage limits|credit balance|enforced_spend_limit_reached|spend limit/i;
function whatFailed(model: string, err: any): 'spent' | 'busy' | 'other' {
  const text = `${String(err?.message || '')} ${JSON.stringify(err?.error ?? '')}`;
  if (isClaude(model)) {
    if (err?.status === 402 || err?.type === 'billing_error' || SPENT.test(text)) return 'spent';
    if (err?.status === 429 || err?.type === 'rate_limit_error') return 'busy';
    return 'other';
  }
  if (err?.status === 429 || err?.code === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(text)) return 'spent';
  return 'other';
}

async function askGemini(model: string, { prompt, image }: Ask) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('missing GEMINI_API_KEY');
  const parts: any[] = [{ text: prompt }];
  if (image) parts.push({ inlineData: image });
  const r = await new GoogleGenAI({ apiKey }).models.generateContent({ model, contents: [{ role: 'user', parts }] });
  // The model that actually answered, as Google names it in the response.
  return { text: r.text || '', model: r.modelVersion || model };
}

// CLAUDE_EFFORT: low, medium or high. How long Claude thinks before answering;
// thinking is charged as output. Low, from the model test: medium read no better.
const CLAUDE_EFFORT = (process.env.CLAUDE_EFFORT || 'low') as 'low' | 'medium' | 'high';

async function askClaude(model: string, { prompt, image }: Ask) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('missing ANTHROPIC_API_KEY');
  const content: Anthropic.ContentBlockParam[] = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.data } });
  content.push({ type: 'text', text: prompt });
  const r = await new Anthropic().messages.create({
    model, max_tokens: 16000, output_config: { effort: CLAUDE_EFFORT },
    messages: [{ role: 'user', content }],
  });
  if (r.stop_reason === 'refusal') throw new Error('the model declined to answer');
  if (r.stop_reason === 'max_tokens') throw new Error('the answer was cut short');
  let text = '';
  for (const block of r.content) if (block.type === 'text') text += block.text;
  // The model that actually answered, as Anthropic names it in the response.
  return { text, model: r.model || model };
}

async function ask(q: Ask): Promise<{ text: string; model: string }> {
  let spent = false;
  let busy = false;
  let last = '';
  for (const model of MODELS) {
    try {
      return await (isClaude(model) ? askClaude(model, q) : askGemini(model, q));
    } catch (err: any) {
      // Status and the company's message only. Never the request.
      console.error(`[oracle] ${model} failed: ${err?.status ?? ''} ${String(err?.message || err).slice(0, 300)}`);
      const what = whatFailed(model, err);
      if (what === 'spent') spent = true;
      if (what === 'busy') busy = true;
      last = String(err?.message || err);
    }
  }
  if (spent) throw new OracleError('The allowance is spent for now.', 'resting');
  if (busy) throw new OracleError('Too many readings this minute.', 'busy');
  // The company's own message stays in the log above; the browser gets ours.
  void last;
  throw new OracleError('The model did not answer.', 'oracle_error');
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

  const { text, model } = await ask({ prompt: GRID_PROMPT, image: { mimeType: m[1] as 'image/jpeg' | 'image/png' | 'image/webp', data } });
  const parsed = parseJson(text);
  if (!Array.isArray(parsed.emojis) || typeof parsed.reading !== 'string' || !parsed.reading.trim()) {
    throw new OracleError('The oracle returned an incomplete sequence.', 'oracle_error');
  }
  const emojis = splitEmoji(parsed.emojis.filter((e: unknown) => typeof e === 'string'));
  return { emojis, reading: parsed.reading.trim(), model };
}

export async function readThree(emojis: [string, string, string]) {
  const { text, model } = await ask({ prompt: threePrompt(emojis) });
  const parsed = parseJson(text);
  if (typeof parsed.reading !== 'string' || !parsed.reading.trim()) {
    throw new OracleError('The oracle returned an incomplete sequence.', 'oracle_error');
  }
  return { emojis: [...emojis], reading: parsed.reading.trim(), model };
}
