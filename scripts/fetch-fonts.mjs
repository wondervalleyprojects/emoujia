// Fetches the licensed Shapiro webfonts at build time, so they never live in
// this public repo. They sit in the studio's private repo
// wondervalleyprojects/wvp-brand-fonts (webFonts/<Face>/font.woff2); Netlify
// holds a read-only token for it. Without the token the build still succeeds
// and Barlow stands in for Shapiro.
//
//   FONTS_TOKEN  a fine-grained GitHub token, Contents: read-only, that repo only
//   FONTS_REPO   optional; defaults to wondervalleyprojects/wvp-brand-fonts
import { mkdir, writeFile } from 'node:fs/promises';

// Served name in public/fonts/shapiro/  <-  path in the font repo
const FILES = {
  'Shapiro75Heavy.woff2': 'webFonts/Shapiro75Heavy/font.woff2',
  'Shapiro75HeavyWide.woff2': 'webFonts/Shapiro75HeavyWide/font.woff2',
  'Shapiro45WelterText.woff2': 'webFonts/Shapiro45WelterText/font.woff2',
};
const { FONTS_TOKEN, FONTS_REPO = 'wondervalleyprojects/wvp-brand-fonts' } = process.env;
const out = new URL('../public/fonts/shapiro/', import.meta.url);

if (!FONTS_TOKEN) {
  console.log('[fonts] FONTS_TOKEN not set; building with Barlow in place of Shapiro.');
  process.exit(0);
}

await mkdir(out, { recursive: true });
let ok = 0;
for (const [name, path] of Object.entries(FILES)) {
  const url = `https://api.github.com/repos/${FONTS_REPO}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${FONTS_TOKEN}`, Accept: 'application/vnd.github.raw' } });
  if (!res.ok) { console.warn(`[fonts] ${path}: ${res.status}; Barlow will stand in.`); continue; }
  await writeFile(new URL(name, out), Buffer.from(await res.arrayBuffer()));
  ok++;
}
console.log(`[fonts] Fetched ${ok} of ${Object.keys(FILES).length} Shapiro files from ${FONTS_REPO}.`);
