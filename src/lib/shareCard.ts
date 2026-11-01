import { formatDate, traceSteps } from './grid';

// Draws the 1080 x 1080 share card (comp E) on a canvas. Wonder Valley
// Projects Lab and the labels in Shapiro Wide, the Essence in Shapiro Heavy,
// everything else in DM Mono. The card is Lab night always.
const INK = '#0A0E2A', WHITE = '#FFFFFF', MUTED = '#B4BAD6', BLUE = '#133284', BLUE_T = '#3A55A8', SIGNAL = '#FA3A6B';
const WIDE = '"Shapiro Wide", "Barlow", sans-serif';
const HEAVY = '"Shapiro Heavy", "Barlow", sans-serif';
const MONO = '"DM Mono", monospace';
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: 'left' | 'right' = 'left') {
  const chars = [...text];
  const width = chars.reduce((w, c) => w + ctx.measureText(c).width + tracking, -tracking);
  let cx = align === 'right' ? x - width : x;
  for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + tracking; }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  // No lone word on the last line.
  if (lines.length > 1 && !lines[lines.length - 1].includes(' ')) {
    const prev = lines[lines.length - 2].split(' ');
    if (prev.length > 1) { lines[lines.length - 1] = `${prev.pop()} ${lines[lines.length - 1]}`; lines[lines.length - 2] = prev.join(' '); }
  }
  return lines;
}

export async function renderShareCard(emojis: string[], essence: string, withBug = true): Promise<HTMLCanvasElement> {
  await Promise.all([`700 15px ${WIDE}`, `700 58px ${HEAVY}`, `500 17px ${MONO}`, `400 21px ${MONO}`].map((f) => document.fonts.load(f).catch(() => null)));
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = INK; ctx.fillRect(0, 0, 1080, 1080);
  ctx.textBaseline = 'top';

  // Masthead strip.
  ctx.fillStyle = WHITE; ctx.fillRect(72, 72, 936, 2);
  ctx.font = `700 15px ${WIDE}`; ctx.fillStyle = WHITE;
  spaced(ctx, 'WONDER VALLEY', 72, 94, 1.8); spaced(ctx, 'PROJECTS LAB', 72, 114, 1.8);
  ctx.font = `500 17px ${MONO}`; ctx.fillStyle = MUTED;
  spaced(ctx, 'EMOUJIA', 384, 92, 1); spaced(ctx, 'EMOUJIA.COM', 384, 114, 1);
  spaced(ctx, 'READ BY A MACHINE', 1008, 92, 1, 'right'); spaced(ctx, 'KEPT BY NO ONE', 1008, 114, 1, 'right');

  // Margin labels.
  ctx.font = `700 15px ${WIDE}`; ctx.fillStyle = MUTED;
  spaced(ctx, 'RULING', 72, 202, 1.8); spaced(ctx, 'SIGN', 72, 222, 1.8);
  spaced(ctx, 'ESSENCE', 72, 562, 1.8); spaced(ctx, 'THE GRID', 72, 758, 1.8);

  // The ruling sign.
  ctx.font = `300px ${EMOJI}`; ctx.fillText(emojis[0] || '', 276, 168);

  // The essence.
  // Two lines at 58px when it fits; otherwise step down until it clears the grid.
  // Slight negative tracking, as in the comp, where the browser supports it.
  const tight = 'letterSpacing' in ctx;
  if (tight) (ctx as any).letterSpacing = '-0.4px';
  const maxW = tight ? 720 : 736;
  let size = 58; ctx.font = `700 ${size}px ${HEAVY}`;
  let lines = wrap(ctx, essence, maxW);
  while ((lines.length > 2 && size > 46) || (lines.length > 3 && size > 32)) { size -= 4; ctx.font = `700 ${size}px ${HEAVY}`; lines = wrap(ctx, essence, maxW); }
  ctx.fillStyle = WHITE; lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 288, 548 + i * size * 1.08));
  if (tight) (ctx as any).letterSpacing = '0px';

  // The grid.
  ctx.font = `44px ${EMOJI}`; emojis.slice(1, 10).forEach((e, i) => ctx.fillText(e, 288 + i * 72, 744));

  // The trace band.
  const L = 72, R = 1008, T = 840, H = 96, n = Math.max(emojis.length, 2), dx = (R - L) / (n - 1);
  ctx.strokeStyle = BLUE; ctx.lineWidth = 1;
  for (let x = L; x <= R; x += 24) { ctx.beginPath(); ctx.moveTo(x + 0.5, T); ctx.lineTo(x + 0.5, T + H); ctx.stroke(); }
  for (let y = T; y <= T + H; y += 24) { ctx.beginPath(); ctx.moveTo(L, y + 0.5); ctx.lineTo(R, y + 0.5); ctx.stroke(); }
  const pts = traceSteps(emojis).map((s, i) => [L + i * dx, T + 12 + s * 24]);
  ctx.fillStyle = BLUE_T;
  for (let i = 0; i < pts.length; i += 3) { const a = pts[i], b = pts[Math.min(i + 2, pts.length - 1)]; ctx.fillRect(a[0] - 6, T + H + 6, b[0] - a[0] + 12, 4); }
  ctx.strokeStyle = SIGNAL; ctx.lineWidth = 3; ctx.lineJoin = 'miter';
  for (let i = 0; i < pts.length; i += 3) { ctx.beginPath(); pts.slice(i, i + 3).forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
  ctx.strokeStyle = BLUE_T; ctx.lineWidth = 2; ctx.fillStyle = INK;
  pts.forEach((p) => { ctx.fillRect(p[0] - 5, p[1] - 5, 10, 10); ctx.strokeRect(p[0] - 5, p[1] - 5, 10, 10); });

  // The bug and the Record line.
  if (withBug) { const bug = await loadImage('/wvp-bug.svg'); if (bug) ctx.drawImage(bug, 72, 972, 48, 48); }
  ctx.font = `400 21px ${MONO}`; ctx.fillStyle = WHITE;
  spaced(ctx, `RECORD · LAB · EMOUJIA · ${formatDate()} · MACHINE UNREVIEWED`, 140, 984, 0.8);
  return c;
}

// Returns a JPEG data URL. If the bug image taints the canvas on some
// browser, redraw without it rather than fail.
export async function shareCardDataUrl(emojis: string[], essence: string): Promise<string | null> {
  try { return (await renderShareCard(emojis, essence, true)).toDataURL('image/jpeg', 0.86); }
  catch { try { return (await renderShareCard(emojis, essence, false)).toDataURL('image/jpeg', 0.86); } catch { return null; } }
}
