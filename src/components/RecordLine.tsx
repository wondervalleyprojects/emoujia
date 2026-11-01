import { formatDate } from '../lib/grid';

// The Record line for live machine output: Level 4, machine unreviewed.
export default function RecordLine() {
  const date = formatDate();
  const fields = ['RECORD', 'LAB', 'EMOUJIA', date, 'MACHINE UNREVIEWED'];
  return (
    <p className="record" aria-label={`Record. Face, lab. Emoujia. Date, ${date}. Made by, machine, unreviewed.`}>
      <span aria-hidden="true">
        {fields.map((f, i) => (
          <span key={f}>
            {i > 0 && <span className="sep"> · </span>}
            <span className="field-part">{f}</span>
          </span>
        ))}
      </span>
    </p>
  );
}
