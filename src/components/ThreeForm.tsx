import React, { useEffect, useRef, useState } from 'react';
import { readTyped } from '../lib/emoji';

// The fallback: one plain field. The person types the three emoji they use
// most from their own keyboard. The studio never offers a set to choose from.
// Copy is PROPOSED (20 Nov 2026).

interface Props { onRead: (emojis: string[]) => void; notice: string | null }

export default function ThreeForm({ onRead, notice }: Props) {
  const [text, setText] = useState('');
  const [tried, setTried] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => { field.current?.focus(); }, []);

  const typed = readTyped(text);
  const n = typed.emojis.length;
  const repeats = new Set(typed.emojis).size !== n;
  const problem = typed.other ? 'Only emoji, please.' : n > 3 ? 'Three is enough. Take one out.' : repeats ? 'Three different ones, please.' : null;
  const ready = n === 3 && !problem;
  const status = problem || (n === 3 ? 'Three. Ready.' : `${n} of 3`);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (ready) onRead(typed.emojis);
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <label htmlFor="emoujia-three" className="small">Your three emoji</label>
      <p id="emoujia-three-hint" className="small muted measure">
        The three you use most, in that order, from your own emoji keyboard. On a computer: the Windows key and period,
        or Control, Command and Space on a&nbsp;Mac.
      </p>
      <input id="emoujia-three" ref={field} className="field three" type="text" inputMode="text" autoComplete="off" autoCorrect="off"
        autoCapitalize="off" spellCheck={false} enterKeyHint="go" maxLength={64} value={text}
        aria-describedby="emoujia-three-hint emoujia-three-count" aria-invalid={tried && !ready ? true : undefined}
        onChange={(e) => setText(e.target.value)} />
      <p id="emoujia-three-count" className="small" aria-live="polite">{status}</p>
      <button type="submit" className="btn" aria-disabled={!ready}>Read my three <span className="arrow" aria-hidden="true">→</span></button>
      {notice && <p className="small" role="alert">{notice}</p>}
    </form>
  );
}
