// Fetches the licensed Shapiro webfonts at build time, so they never live in
// this public repo. The files sit in a private repo the studio controls;
// Netlify holds a read-only token for it. Without the token the build still
// succeeds and Barlow stands in for Shapiro.
//
//   FONTS_REPO   owner/name of the private repo, e.g. wondervalleyprojects/wvp-brand-fonts
//   FONTS_TOKEN  a fine-grained GitHub token with read access to that repo only
//   FONTS_DIR    folder in that repo holding the .woff2 files (default: shapiro)
import { mkdir, writeFile } from 'node:fs/promises';

const FILES = ['Shapiro75Heavy.woff2', 'Shapiro75HeavyWide.woff2', 'Shapiro45Welter.woff2'];
const { FONTS_REPO, FONTS_TOKEN, FONTS_DIR = 'shapiro' } = process.env;
const out = new URL('../public/fonts/shapiro/', import.meta.url);

if (!FONTS_REPO || !FONTS_TOKEN) {
  console.log('[fonts] FONTS_REPO or FONTS_TOKEN not set; building with Barlow in place of Shapiro.');
  process.exit(0);
}

await mkdir(out, { recursive: true });
let ok = 0;
for (const name of FILES) {
  const url = `https://api.github.com/repos/${FONTS_REPO}/contents/${FONTS_DIR}/${name}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${FONTS_TOKEN}`, Accept: 'application/vnd.github.raw' } });
  if (!res.ok) { console.warn(`[fonts] ${name}: ${res.status}; Barlow will stand in.`); continue; }
  await writeFile(new URL(name, out), Buffer.from(await res.arrayBuffer()));
  ok++;
}
console.log(`[fonts] Fetched ${ok} of ${FILES.length} Shapiro files.`);
