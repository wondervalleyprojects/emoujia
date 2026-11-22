import React, { useEffect, useState } from 'react';

// The wait, as a machine log. Lines appear one at a time and stay; nothing
// loops. When the lines run out, the log simply waits.
const LINES = [
  'Reading the grid',
  'Consulting the archives',
  'Mapping the emotional frequency',
  'Reticulating splines',
  'Making the connections',
  'Folded hands emoji',
  'Texting the spirits',
  'Deciphering the unspoken',
  'Tracing the digital patterns',
  'Sifting through the symbols',
];

export default function Loading({ headingRef }: { headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const [count, setCount] = useState(1);
  useEffect(() => {
    if (count >= LINES.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), 1600);
    return () => clearTimeout(t);
  }, [count]);
  return (
    <section className="row">
      <h2 className="label" ref={headingRef} tabIndex={-1}>The machine is reading</h2>
      <ul className="log" aria-live="polite">
        {LINES.slice(0, count).map((l) => <li key={l}>{l}</li>)}
      </ul>
    </section>
  );
}
