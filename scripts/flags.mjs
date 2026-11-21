// Build flags, read at build time. Nothing is changed in Netlify.
//
// The three-emoji reading waits for Japhy's approval of its voice and its
// notice. Until then it is on only in local development and in Netlify deploy
// previews (Netlify sets CONTEXT=deploy-preview on those builds), or when
// EMOUJIA_FALLBACK=on. Production builds leave it out.
export function fallbackOn(mode) {
  const v = String(process.env.EMOUJIA_FALLBACK || '').toLowerCase();
  if (v === 'off') return false;
  return v === 'on' || mode === 'development' || process.env.CONTEXT === 'deploy-preview';
}
