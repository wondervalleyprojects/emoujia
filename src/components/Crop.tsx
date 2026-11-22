import React, { useEffect, useRef, useState } from 'react';
import { cropToJpeg, startingRect, type Rect } from '../lib/image';

// Crop the screenshot to the keyboard before it is sent. Only the pixels inside
// the box leave the device. The box moves by touch or mouse (drag it, or a
// corner) and by keyboard (arrow keys move it; Shift and arrow keys size it).

interface Props {
  img: HTMLImageElement;
  src: string;
  onRead: (jpeg: string) => void;
  onCancel: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

type Mode = 'move' | 'nw' | 'ne' | 'sw' | 'se';
const MIN = 0.1;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function apply(r: Rect, mode: Mode, dx: number, dy: number): Rect {
  if (mode === 'move') return { ...r, x: clamp(r.x + dx, 0, 1 - r.w), y: clamp(r.y + dy, 0, 1 - r.h) };
  let { x, y, w, h } = r;
  const right = x + w, bottom = y + h;
  if (mode === 'nw' || mode === 'sw') { x = clamp(x + dx, 0, right - MIN); w = right - x; }
  if (mode === 'ne' || mode === 'se') { w = clamp(w + dx, MIN, 1 - x); }
  if (mode === 'nw' || mode === 'ne') { y = clamp(y + dy, 0, bottom - MIN); h = bottom - y; }
  if (mode === 'sw' || mode === 'se') { h = clamp(h + dy, MIN, 1 - y); }
  return { x, y, w, h };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export default function Crop({ img, src, onRead, onCancel, headingRef }: Props) {
  const [rect, setRect] = useState<Rect>(() => startingRect(img));
  const [said, setSaid] = useState('');
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: Mode; x: number; y: number; start: Rect; id: number } | null>(null);

  useEffect(() => { headingRef.current?.focus(); }, [headingRef]);

  const down = (mode: Mode) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start: rect, id: e.pointerId };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, f = frame.current;
    if (!d || !f || d.id !== e.pointerId) return;
    const b = f.getBoundingClientRect();
    setRect(apply(d.start, d.mode, (e.clientX - d.x) / b.width, (e.clientY - d.y) / b.height));
  };
  const up = (e: React.PointerEvent) => { if (drag.current?.id === e.pointerId) drag.current = null; };

  const key = (e: React.KeyboardEvent) => {
    const step = 0.02;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    const next = apply(rect, e.shiftKey ? 'se' : 'move', v[0], v[1]);
    setRect(next);
    setSaid(`Box ${pct(next.w)} wide and ${pct(next.h)} tall, ${pct(next.x)} from the left and ${pct(next.y)} from the top.`);
  };

  const s = { left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) };
  return (
    <section className="row" aria-labelledby="emoujia-crop">
      <h2 className="label" id="emoujia-crop" ref={headingRef} tabIndex={-1}>Crop to the keyboard</h2>
      <div className="stack">
        {/* PROPOSED */}
        <p className="small measure">Move the box to just your emoji. Only what is inside the box is sent.</p>
        <div className="crop-frame" ref={frame} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <img src={src} alt="Your screenshot" draggable={false} />
          <div className="crop-shade" style={{ left: 0, top: 0, width: '100%', height: pct(rect.y) }} />
          <div className="crop-shade" style={{ left: 0, top: pct(rect.y + rect.h), width: '100%', height: pct(1 - rect.y - rect.h) }} />
          <div className="crop-shade" style={{ left: 0, top: pct(rect.y), width: pct(rect.x), height: pct(rect.h) }} />
          <div className="crop-shade" style={{ left: pct(rect.x + rect.w), top: pct(rect.y), width: pct(1 - rect.x - rect.w), height: pct(rect.h) }} />
          <div className="crop-box" style={s} tabIndex={0} role="group" aria-roledescription="crop box"
            aria-label="Crop box. Arrow keys move it. Shift and arrow keys change its size." onPointerDown={down('move')} onKeyDown={key}>
            {(['nw', 'ne', 'sw', 'se'] as Mode[]).map((m) => <span key={m} className={`crop-handle ${m}`} aria-hidden="true" onPointerDown={down(m)} />)}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{said}</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => onRead(cropToJpeg(img, rect))}>Read this part <span className="arrow" aria-hidden="true">→</span></button>
          <button type="button" className="textlink" onClick={() => onRead(cropToJpeg(img))}>Send the whole screenshot</button>
          <button type="button" className="textlink" onClick={onCancel}>Choose another</button>
        </div>
      </div>
    </section>
  );
}
