import React from 'react';
import { formatDate, parseReading } from '../lib/grid';
import TraceBand from './TraceBand';
import RecordLine from './RecordLine';
import type { Kind } from '../services/oracle';

interface Props { kind: Kind; emojis: string[]; reading: string; essence: string; model: string; headingRef: React.RefObject<HTMLHeadingElement | null> }

const LABELS: Record<string, string> = {
  'THE RULING SIGN': 'Ruling sign',
  'THE SHADOW': 'Shadow',
  'THE READING': 'The reading',
  'YOUR FORECAST': 'Forecast',
};

export default function Reading({ kind, emojis, reading, essence, model, headingRef }: Props) {
  const sections = parseReading(reading).filter((s) => s.header !== 'THE ESSENCE');
  const three = kind === 'three';
  return (
    <article aria-labelledby="emoujia-reading-title">
      <TraceBand emojis={emojis} />
      <div className="masthead">
        <p className="label">Wonder Valley Projects Lab</p>
        <h2 className="label" id="emoujia-reading-title" ref={headingRef} tabIndex={-1}>{three ? 'Emoujia, a short reading' : 'Emoujia, a reading'}</h2>
        <p className="label">{formatDate()}</p>
      </div>

      {three && (
        <section className="row">
          <h3 className="label">Three emoji</h3>
          {/* PROPOSED: says plainly, every time, that this is not the full reading. */}
          <p className="small measure">Three emoji tell the oracle less than a whole grid. This is the short reading, not the full&nbsp;one.</p>
        </section>
      )}
      <section className="row">
        <h3 className="label">Ruling sign</h3>
        <p className="ruling emoji" aria-label={`Your ruling sign: ${emojis[0]}`}>{emojis[0]}</p>
      </section>
      {essence && (
        <section className="row">
          <h3 className="label">Essence</h3>
          <p className="essence">{essence}</p>
        </section>
      )}
      <section className="row">
        <h3 className="label">{three ? 'Your three' : 'The grid'}</h3>
        <p className="grid-emoji emoji">{emojis.map((e, i) => <span key={i}>{e}</span>)}</p>
      </section>

      <section className="row">
        <h3 className="label">Read by</h3>
        <div className="stack-tight">
          <p className="small">The words below are the machine's own. No person reviewed&nbsp;them.</p>
          <p className="casing">CASING · MODEL {(model || 'GEMINI').toUpperCase()} · EDITS 0</p>
        </div>
      </section>
      {sections.map((s) => (
        <section className="row" key={s.header}>
          <h3 className="label">{LABELS[s.header] || s.header}</h3>
          <div className="machine">{s.content.split(/\n+/).map((p, k) => <p key={k}>{p}</p>)}</div>
        </section>
      ))}
      <RecordLine />
    </article>
  );
}
