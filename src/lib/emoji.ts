// The three-emoji check. The browser uses it to count as the person types; the
// server uses the same code to refuse anything else before the model is called.

// RGI_Emoji needs the regular expression "v" flag (Node 20, Safari 17,
// Chrome 112). Older browsers fall back to a looser test; the server always
// has the strict one, so nothing loose reaches the model.
const STRICT: RegExp | null = (() => { try { return new RegExp('^\\p{RGI_Emoji}$', 'v'); } catch { return null; } })();
const LOOSE = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})[\p{Emoji_Modifier}️‍⃣\p{Extended_Pictographic}]*$/u;
const MAX_UNITS = 32; // the longest RGI emoji (a family with skin tones) is 35 code units; none we accept need more than this

function segments(text: string): string[] {
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return [...seg.segment(text)].map((s) => s.segment);
}

// One emoji, or null. Accepts an emoji typed without its emoji selector
// (some keyboards send a bare heart) by trying it with U+FE0F.
export function asEmoji(grapheme: string): string | null {
  if (!grapheme || grapheme.length > MAX_UNITS) return null;
  const test = STRICT || LOOSE;
  if (test.test(grapheme)) return grapheme;
  const withSelector = grapheme.endsWith('️') ? grapheme : grapheme + '️';
  if (test.test(withSelector)) return withSelector;
  return null;
}

export interface Typed { emojis: string[]; other: boolean }

// What the person has typed so far: the emoji in order, and whether anything
// that is not an emoji or a space is in the field.
export function readTyped(text: string): Typed {
  const emojis: string[] = [];
  let other = false;
  for (const g of segments(text)) {
    if (/^\s+$/u.test(g)) continue;
    const e = asEmoji(g);
    if (e) emojis.push(e); else other = true;
  }
  return { emojis, other };
}

export type ThreeResult = { ok: true; emojis: [string, string, string] } | { ok: false; reason: string };

// The server's check. The body must be exactly { "emojis": [a, b, c] }: three
// strings, each one emoji and nothing else, all different. Anything else is
// refused.
export function validateThree(body: unknown): ThreeResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, reason: 'Send three emoji.' };
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'emojis') return { ok: false, reason: 'Send three emoji and nothing else.' };
  const list = (body as { emojis: unknown }).emojis;
  if (!Array.isArray(list) || list.length !== 3) return { ok: false, reason: 'Send exactly three emoji.' };
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== 'string') return { ok: false, reason: 'Each of the three must be an emoji.' };
    const parts = segments(item.trim());
    if (parts.length !== 1) return { ok: false, reason: 'Each of the three must be one emoji.' };
    const e = STRICT ? (STRICT.test(parts[0]) ? parts[0] : STRICT.test(parts[0] + '️') ? parts[0] + '️' : null) : asEmoji(parts[0]);
    if (!e || e.length > MAX_UNITS) return { ok: false, reason: 'Each of the three must be an emoji.' };
    out.push(e);
  }
  // [CONFIRM: refuse repeats] Three the person uses most should be three different ones.
  if (new Set(out).size !== 3) return { ok: false, reason: 'Three different emoji, please.' };
  return { ok: true, emojis: out as [string, string, string] };
}
