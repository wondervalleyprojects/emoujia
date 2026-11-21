// Which Gemini model reads emoji keyboards best? Runs the grid prompt, exactly
// as production sends it, on each screenshot with each model Google currently
// offers, and scores what comes back against the emoji you confirmed.
//
//   npx tsx scripts/model-test.ts [folder]      (folder defaults to model-test/)
//
// The folder (ignored by git) holds the screenshots and expected.json:
//   { "iphone-1.png": "😂🥲🔥🐈‍⬛...", "gboard-1.png": "..." }
// each value the emoji in the screenshot, left to right, top to bottom.
//
// Each screenshot is first shrunk the way the browser shrinks it (1024 px on
// the long side, JPEG at 0.8) with macOS sips, so token counts match
// production. These calls go to Google under the key's terms: free tier terms
// for a free key. Use only screenshots you are content to send.
//
// Writes model-test/results.json and prints a table. Nothing else is kept.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { GRID_PROMPT, threePrompt } from '../server/prompts';
import { splitEmoji } from '../src/lib/grid';

dotenv.config();
const dir = process.argv[2] || 'model-test';
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('Set GEMINI_API_KEY in .env first.'); process.exit(1); }
const expectedFile = join(dir, 'expected.json');
if (!existsSync(expectedFile)) { console.error(`Missing ${expectedFile}. See the top of this file.`); process.exit(1); }
const expected: Record<string, string> = JSON.parse(readFileSync(expectedFile, 'utf8'));
const shots = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp|heic)$/i.test(f) && expected[f]);
if (!shots.length) { console.error('No screenshot in the folder has a line in expected.json.'); process.exit(1); }

const ai = new GoogleGenAI({ apiKey: key });

// Every model this key can call that generates content and is a Gemini model.
// ONLY (comma separated) narrows the list.
const models: string[] = [];
for await (const m of await ai.models.list()) {
  const name = (m.name || '').replace(/^models\//, '');
  const actions: string[] = (m as any).supportedActions || [];
  if (/^gemini-/.test(name) && actions.includes('generateContent') && !/embedding|tts|image-generation|live|audio|transcribe|translate/i.test(name)) models.push(name);
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
function score(want: string[], got: string[]) {
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
      const r = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: GRID_PROMPT }, { inlineData: { mimeType: 'image/jpeg', data: asBrowserSends(join(dir, shot)) } }] }] });
      const ms = Date.now() - t0;
      const parsed = JSON.parse((r.text || '').replace(/```json\n?|\n?```/g, '').replace(/```\n?|\n?```/g, '').trim());
      const got = splitEmoji(parsed.emojis || []);
      const u = r.usageMetadata || {};
      results.push({ model, answeredAs: r.modelVersion, shot, ms, ...score(want, got), got: got.join(''), tokens: { prompt: u.promptTokenCount, output: u.candidatesTokenCount, thinking: u.thoughtsTokenCount || 0, total: u.totalTokenCount }, reading: parsed.reading });
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
const three: [string, string, string] = ['🔥', '🫠', '🐈‍⬛'];
for (const model of list) {
  try {
    const t0 = Date.now();
    const r = await ai.models.generateContent({ model, contents: [{ role: 'user', parts: [{ text: threePrompt(three) }] }] });
    const u = r.usageMetadata || {};
    results.push({ model, answeredAs: r.modelVersion, shot: 'three:' + three.join(''), ms: Date.now() - t0, tokens: { prompt: u.promptTokenCount, output: u.candidatesTokenCount, thinking: u.thoughtsTokenCount || 0, total: u.totalTokenCount } });
    console.log(`${model.padEnd(28)} three emoji          tokens in ${u.promptTokenCount} out ${u.candidatesTokenCount} thinking ${u.thoughtsTokenCount || 0}`);
  } catch (err: any) { console.log(`${model.padEnd(28)} three emoji          ERROR ${String(err?.message || err).slice(0, 200)}`); }
}

writeFileSync(join(dir, 'results.json'), JSON.stringify(results, null, 2));
console.log(`\nWrote ${join(dir, 'results.json')}.`);
