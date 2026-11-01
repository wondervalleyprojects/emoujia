import { useEffect, useRef } from 'react';
import { traceSteps } from '../lib/grid';

// The Lab's trace, drawn from this grid: an Ink grid, Studio Blue slots,
// one Signal line joining the slots in triads. It plots once, like a pen.
export default function TraceBand({ emojis }: { emojis: string[] }) {
  const W = 1080, H = 132, L = 24, R = W - 24, T = 18, step = 24;
  const steps = traceSteps(emojis);
  const n = Math.max(steps.length, 2);
  const dx = (R - L) / (n - 1);
  const pts = steps.map((s, i) => [L + i * dx, T + 12 + s * step] as const);
  const d = pts.reduce((acc, p, i) => acc + (i % 3 === 0 ? `M${p[0]} ${p[1]}` : ` L${p[0]} ${p[1]}`), '');
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const len = path.current?.getTotalLength?.() || 4000;
    path.current?.style.setProperty('--len', String(Math.ceil(len)));
  }, [d]);

  const lines = [];
  for (let x = L; x <= R; x += step) lines.push(<line key={`x${x}`} x1={x} y1={T} x2={x} y2={T + 96} />);
  for (let y = T; y <= T + 96; y += step) lines.push(<line key={`y${y}`} x1={L} y1={y} x2={R} y2={y} />);

  return (
    <svg className="band" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A trace drawn from your grid: each emoji is a slot, joined in threes.">
      <g stroke="#133284" strokeWidth="1">{lines}</g>
      {pts.map((p, i) => i % 3 === 0 && (
        <rect key={`t${i}`} x={p[0] - 6} y={T + 104} width={(pts[Math.min(i + 2, pts.length - 1)][0] - p[0]) + 12} height="4" fill="#3A55A8" />
      ))}
      {pts.map((p, i) => <rect key={i} x={p[0] - 5} y={p[1] - 5} width="10" height="10" fill="#0A0E2A" stroke="#3A55A8" strokeWidth="2" />)}
      <path ref={path} className="trace" d={d} fill="none" stroke="#FA3A6B" strokeWidth="3" />
    </svg>
  );
}
