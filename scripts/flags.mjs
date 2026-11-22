// Build flags, read at build time. Nothing is changed in Netlify.
//
// The three-emoji reading is on everywhere from 21 Nov 2026 (Japhy): the
// how-to promises iPhone only and sends everyone else to it.
// EMOUJIA_FALLBACK=off leaves it out of a build.
export function fallbackOn(_mode) {
  return String(process.env.EMOUJIA_FALLBACK || '').toLowerCase() !== 'off';
}
