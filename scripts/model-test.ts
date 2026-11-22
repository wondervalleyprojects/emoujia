// Which model reads emoji keyboards best? Runs the grid prompt, exactly as
// production sends it, on each screenshot with each model Google currently
// offers (and, when ANTHROPIC_API_KEY is in .env, Claude Haiku, Sonnet and
// Opus), and scores what comes back against the emoji you confirmed.
//
//   npx tsx scripts/model-test.ts [folder]      (folder defaults to model-test/)
//
// The folder (ignored by git) holds the screenshots and expected.json:
//   { "iphone-1.png": "😂🥲🔥🐈‍⬛...", "gboard-1.png": "..." }
// each value the emoji in the screenshot, left to right, top to bottom.
//
// Each screenshot is first shrunk the way the browser shrinks it (1024 px on
// the long side, JPEG at 0.8) with macOS sips, so token counts match
// production. These calls go to Google, or to Anthropic, under that key's
// terms: free tier terms for a free Google key. Anthropic has no free tier, so
// Claude calls cost money. Use only screenshots you are content to send.
// CLAUDE_EFFORT (low, medium, high) sets how long Claude thinks; default low.
//
// Writes model-test/results.json and prints a table. Nothing else is kept.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { GRID_PROMPT, threePrompt } from '../server/prompts';
import { splitEmoji } from '../src/lib/grid';

dotenv.config();
const dir = process.argv[2] || 'model-test';
const key = process.env.GEMINI_API_KEY;
if (!key && !process.env.ANTHROPIC_API_KEY) { console.error('Set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env first.'); process.exit(1); }
const expectedFile = join(dir, 'expected.json');
if (!existsSync(expectedFile)) { console.error(`Missing ${expectedFile}. See the top of this file.`); process.exit(1); }
const expected: Record<string, string> = JSON.parse(readFileSync(expectedFile, 'utf8'));
const shots = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp|heic)$/i.test(f) && expected[f]).sort();
if (!shots.length) { console.error('No screenshot in the folder has a line in expected.json.'); process.exit(1); }

const ai = new GoogleGenAI({ apiKey: key || 'none' });

// Every model the Google key can call that generates content and is a Gemini model.
// ONLY (comma separated) narrows the list.
const models: string[] = [];
if (key) for await (const m of await ai.models.list()) {
  const name = (m.name || '').replace(/^models\//, '');
  const actions: string[] = (m as any).supportedActions || [];
  if (/^gemini-/.test(name) && actions.includes('generateContent') && !/embedding|tts|image|banana|robotics|computer-use|customtools|live|audio|transcribe|translate/i.test(name)) models.push(name);
}
// Anthropic's current three, when there is a key for them.
const CLAUDE = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'];
if (process.env.ANTHROPIC_API_KEY) models.push(...CLAUDE);
const effort = (process.env.CLAUDE_EFFORT || 'low') as 'low' | 'medium' | 'high';

// One call, either company. Tokens: output excludes thinking for Google and
// includes it for Anthropic, so "billedOut" is the comparable number.
async function run(model: string, prompt: string, jpegBase64?: string) {
  if (model.startsWith('claude-')) {
    const content: Anthropic.ContentBlockParam[] = [];
    if (jpegBase64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpegBase64 } });
    content.push({ type: 'text', text: prompt });
    const r = await new Anthropic().messages.create({ model, max_tokens: 16000, output_config: { effort }, messages: [{ role: 'user', content }] });
    if (r.stop_reason !== 'end_turn') throw new Error(`stopped: ${r.stop_reason}`);
    const text = r.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    return { text, answeredAs: r.model, tokens: { prompt: r.usage.input_tokens, output: r.usage.output_tokens, thinking: 0, billedOut: r.usage.output_tokens, total: r.usage.input_tokens + r.usage.output_tokens } };
  }
  const parts: any[] = [{ text: prompt }];
  if (jpegBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } });
  const r = await ai.models.generateContent({ model, contents: [{ role: 'user', parts }] });
  const u = r.usageMetadata || {};
  const thinking = u.thoughtsTokenCount || 0;
  return { text: r.text || '', answeredAs: r.modelVersion, tokens: { prompt: u.promptTokenCount, output: u.candidatesTokenCount, thinking, billedOut: (u.candidatesTokenCount || 0) + thinking, total: u.totalTokenCount } };
}

const only = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const list = only.length ? models.filter((m) => only.includes(m)) : models;
console.log(`Models offered to this key (${models.length}): ${models.join(', ')}`);
console.log(`Testing: ${list.join(', ')}\n`);

const tmp = mkdtempSync(join(tmpdir(), 'emoujia-model-test-'));
function asBrowserSends(file: string): string {
  const out = join(tmp, basename(file, extname(file)) + '.jpg');
  execFileSync('sips', ['-Z', '1024', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', file, '--out', out], { stdio: 'ignore' });
  return readFileSync(out).toString('base64');
}

// Scores: slots in the right place, emoji found anywhere, emoji invented.
// The emoji selector (U+FE0F) is invisible and keyboards differ on it, so it is not counted.
const bare = (e: string) => e.replace(/\uFE0F/g, '');
function score(wantIn: string[], gotIn: string[]) {
  const want = wantIn.map(bare), got = gotIn.map(bare);
  const inPlace = want.filter((e, i) => got[i] === e).length;
  const pool = [...got]; let found = 0;
  for (const e of want) { const i = pool.indexOf(e); if (i >= 0) { found++; pool.splice(i, 1); } }
  return { inPlace, found, invented: pool.length, of: want.length };
}

const results: any[] = [];
for (const model of list) {
  for (const shot of shots) {
    const want = splitEmoji([expected[shot]]);
    const t0 = Date.now();
    try {
      const r = await run(model, GRID_PROMPT, asBrowserSends(join(dir, shot)));
      const ms = Date.now() - t0;
      const parsed = JSON.parse(r.text.replace(/```json\n?|\n?```/g, '').replace(/```\n?|\n?```/g, '').trim());
      const got = splitEmoji(parsed.emojis || []);
      results.push({ model, answeredAs: r.answeredAs, shot, ms, ...score(want, got), got: got.join(''), tokens: r.tokens, reading: parsed.reading });
    } catch (err: any) {
      results.push({ model, shot, ms: Date.now() - t0, error: String(err?.message || err).slice(0, 200) });
    }
    const last = results.at(-1);
    console.log(last.error
      ? `${model.padEnd(28)} ${shot.padEnd(20)} ERROR ${last.error}`
      : `${model.padEnd(28)} ${shot.padEnd(20)} in place ${last.inPlace}/${last.of}  found ${last.found}/${last.of}  invented ${last.invented}  ${(last.ms / 1000).toFixed(1)}s  tokens in ${last.tokens.prompt} out ${last.tokens.output} thinking ${last.tokens.thinking}`);
  }
}

// One fallback reading per model, for its token counts.
// THREE: the three emoji to send, from the person running the test (their own data only).
const typed = splitEmoji([process.env.THREE || '']);
if (typed.length !== 3) { console.log('\nSet THREE to three emoji to measure the fallback reading. Skipped.'); writeFileSync(join(dir, 'results.json'), JSON.stringify(results, null, 2)); process.exit(0); }
const three = typed as [string, string, string];
for (const model of list) {
  try {
    const t0 = Date.now();
    const r = await run(model, threePrompt(three));
    results.push({ model, answeredAs: r.answeredAs, shot: 'three:' + three.join(''), ms: Date.now() - t0, tokens: r.tokens, text: r.text });
    console.log(`${model.padEnd(28)} three emoji          ${((Date.now() - t0) / 1000).toFixed(1)}s  tokens in ${r.tokens.prompt} out ${r.tokens.output} thinking ${r.tokens.thinking}`);
  } catch (err: any) { console.log(`${model.padEnd(28)} three emoji          ERROR ${String(err?.message || err).slice(0, 200)}`); }
}

writeFileSync(join(dir, 'results.json'), JSON.stringify(results, null, 2));
console.log(`\nWrote ${join(dir, 'results.json')}.`);
