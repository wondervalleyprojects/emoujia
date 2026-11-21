// Stub host: the site's light switch (data-theme on <html>, as the site does),
// and window.emoujiaProbe(), which reports what the embed actually receives
// from the host: token values read inside the shadow root, and which fonts the
// browser loaded. Run it in the console, or press a light button.
const html = document.documentElement;
function setTheme(t) {
  if (t === 'auto') html.removeAttribute('data-theme'); else html.setAttribute('data-theme', t);
  setTimeout(report, 50);
}
document.querySelectorAll('[data-theme-choice]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeChoice)));

window.emoujiaProbe = function () {
  const mount = document.querySelector('[data-emoujia]');
  const inner = mount && mount.shadowRoot && mount.shadowRoot.querySelector('.emoujia');
  if (!inner) return { mounted: false };
  const cs = getComputedStyle(inner);
  const tokens = {};
  for (const t of ['--pw-role-ground', '--pw-role-text', '--pw-role-accent', '--pw-role-muted', '--pw-font-display', '--pw-font-label', '--pw-font-text', '--pw-font-mono', '--pw-tap-min']) tokens[t] = cs.getPropertyValue(t).trim();
  const sample = (sel) => { const el = mount.shadowRoot.querySelector(sel); if (!el) return null; const s = getComputedStyle(el); return { font: s.fontFamily, color: s.color, background: s.backgroundColor, size: s.fontSize, spacing: s.letterSpacing, transform: s.textTransform }; };
  const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`);
  return {
    mounted: true,
    theme: html.getAttribute('data-theme') || 'auto',
    tokens,
    rootText: { font: cs.fontFamily, color: cs.color, spacing: cs.letterSpacing, transform: cs.textTransform },
    label: sample('.label'), bracket: sample('.bracket'), btn: sample('.btn, .textlink'), machine: sample('.machine'),
    hostElementFont: getComputedStyle(mount).fontFamily,
    fontsLoaded: [...new Set(loaded)],
  };
};

function report() {
  const out = document.getElementById('probe-out');
  const p = window.emoujiaProbe();
  if (out && p.mounted) out.textContent = ` ${p.theme}: ground ${p.tokens['--pw-role-ground']}, accent ${p.tokens['--pw-role-accent']}.`;
}
