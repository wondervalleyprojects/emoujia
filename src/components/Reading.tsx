import { formatDate, parseReading } from '../lib/grid';
import TraceBand from './TraceBand';

interface Props { emojis: string[]; reading: string; essence: string; model: string }

const LABELS: Record<string, string> = {
  'THE RULING SIGN': 'Ruling sign',
  'THE SHADOW': 'Shadow',
  'THE READING': 'The reading',
  'YOUR FORECAST': 'Forecast',
};

export default function Reading({ emojis, reading, essence, model }: Props) {
  const sections = parseReading(reading).filter((s) => s.header !== 'THE ESSENCE');
  return (
    <article aria-labelledby="reading-title">
      <TraceBand emojis={emojis} />
      <div className="masthead" style={{ marginTop: 32 }}>
        <p className="label">Wonder Valley Projects Lab</p>
        <p className="label" id="reading-title">Emoujia, a reading</p>
        <p className="label">{formatDate()}</p>
      </div>

      <section className="row">
        <h2 className="label">Ruling sign</h2>
        <p className="ruling" aria-label={`Your ruling sign: ${emojis[0]}`}>{emojis[0]}</p>
      </section>
      {essence && (
        <section className="row">
          <h2 className="label">Essence</h2>
          <p className="essence">{essence}</p>
        </section>
      )}
      <section className="row">
        <h2 className="label">The grid</h2>
        <p className="grid-emoji">{emojis.map((e, i) => <span key={i}>{e}</span>)}</p>
      </section>

      <section className="row">
        <h2 className="label">Read by</h2>
        <div>
          <p className="small">The words below are the machine's own. No person reviewed&nbsp;them.</p>
          <p className="casing" style={{ marginTop: 8 }}>CASING · MODEL {(model || 'GEMINI').toUpperCase()} · EDITS 0</p>
        </div>
      </section>
      {sections.map((s) => (
        <section className="row" key={s.header}>
          <h2 className="label">{LABELS[s.header] || s.header}</h2>
          <div className="machine">{s.content.split(/\n+/).map((p, k) => <p key={k}>{p}</p>)}</div>
        </section>
      ))}
    </article>
  );
}
