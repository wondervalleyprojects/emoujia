// Runs after both builds. Writes dist/_redirects, which Netlify reads before
// the rules in netlify.toml.
//
// 1. The emoujia.com redirect, OFF unless EMOUJIA_COM_REDIRECT is set:
//      EMOUJIA_COM_REDIRECT=302   temporary (first week: browsers do not keep it)
//      EMOUJIA_COM_REDIRECT=301   permanent (browsers keep it; turning it off will not reach them)
//    The rules match the emoujia.com host only, so the project's own
//    netlify.app address keeps serving the embed and the API for the studio
//    site's rewrites. How to turn it on and off: docs/OPERATIONS.md.
//
// 2. The stub host page (stub/), copied into the build and given its rewrites
//    everywhere except production, so the cap-free stub route never ships live.
import { appendFileSync, cpSync, existsSync, writeFileSync } from 'node:fs';

const DEST = 'https://wondervalleyprojects.com/lab/emoujia/';
const lines = ['# Written by scripts/postbuild.mjs. Do not edit by hand.'];

const mode = String(process.env.EMOUJIA_COM_REDIRECT || '').trim();
if (mode === '301' || mode === '302') {
  for (const host of ['https://emoujia.com', 'https://www.emoujia.com', 'http://emoujia.com', 'http://www.emoujia.com']) {
    lines.push(`${host}/*  ${DEST}  ${mode}!`);
  }
  console.log(`[postbuild] emoujia.com redirect ON (${mode}) to ${DEST}`);
} else {
  if (mode) console.warn(`[postbuild] EMOUJIA_COM_REDIRECT="${mode}" is not 301 or 302; the redirect stays off.`);
  console.log('[postbuild] emoujia.com redirect off.');
}

const production = process.env.CONTEXT === 'production';
if (!production && existsSync('stub')) {
  cpSync('stub', 'dist/stub', { recursive: true });
  // The stub imitates the studio site: same-origin addresses, rewritten here.
  lines.push(
    '/stub/lab/emoujia/embed.js    /embed/emoujia.js    200',
    '/stub/lab/emoujia/embed.css   /embed/emoujia.css   200',
    '/stub/lab/emoujia/api/*       /.netlify/functions/api/:splat   200',
  );
  console.log('[postbuild] stub host page at /stub/lab/emoujia/ (not in production)');
}

writeFileSync('dist/_redirects', lines.join('\n') + '\n');
