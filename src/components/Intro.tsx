import React, { useRef, useState } from 'react';
import ThreeForm from './ThreeForm';

// The first view inside the mount: the invitation to bring a screenshot, the
// three steps, and beneath them one small line for people who cannot. The
// host page supplies the heading, the question and the page's own words.

interface Props {
  onFile: (file: File) => void;
  onThree: (emojis: string[]) => void;
  notice: string | null;
  threeNotice: string | null;
  fallback: boolean;
  startWithThree: boolean;
  bracketRef: React.RefObject<HTMLButtonElement | null>;
}

export default function Intro({ onFile, onThree, notice, threeNotice, fallback, startWithThree, bracketRef }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [three, setThree] = useState(startWithThree);
  return (
    <>
      <section className="row" aria-labelledby="emoujia-invite">
        <h2 className="label" id="emoujia-invite">Your part</h2>
        <div className="stack-tight">
          <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
          <button type="button" ref={bracketRef} className="bracket" aria-label="Your part: read my emoji. Choose a screenshot of your emoji keyboard."
            onClick={() => input.current?.click()}>
            <span>[Read my emoji]</span>
          </button>
          <p className="small muted">Or drop the screenshot&nbsp;here.</p>
          {notice && <p className="small" role="alert">{notice}</p>}
          {/* Logged exception (EMJ-001, 1 Nov 2026): free Gemini tier, disclosed here.
              Replaced in step 3 by the notice for the tier Japhy chooses. */}
          <p className="small muted measure" id="privacy">
            Your screenshot is read by Google's Gemini, which may use it to improve its models. We keep&nbsp;nothing.
          </p>
        </div>
      </section>

      <section className="row" aria-labelledby="emoujia-how">
        <h2 className="label" id="emoujia-how">How</h2>
        {/* iPhone only until an Android keyboard has been tested (Japhy, 20 Nov 2026). */}
        <ol className="small steps">
          <li>Open your emoji keyboard on your iPhone.</li>
          <li>Screenshot the Frequently Used section, all of it.</li>
          <li>Bring it here. You can crop it before it is sent. The reading takes about half a&nbsp;minute.</li>
        </ol>
      </section>

      {fallback && (
        <section className="row" aria-labelledby="emoujia-three-label">
          <h2 className="label" id="emoujia-three-label">No screenshot</h2>
          <div className="stack-tight">
            {/* PROPOSED */}
            {!three && <button type="button" className="textlink small" aria-expanded="false" onClick={() => setThree(true)}>No screenshot? Enter the three you use&nbsp;most.</button>}
            {three && <ThreeForm onRead={onThree} notice={threeNotice} />}
            {three && (
              <p className="small muted measure">
                {/* Replaced in step 3 by the notice for the tier Japhy chooses. */}
                [THREE EMOJI NOTICE]
              </p>
            )}
          </div>
        </section>
      )}

      <section className="row" aria-labelledby="emoujia-keep">
        <h2 className="label" id="emoujia-keep">What we keep</h2>
        <p className="small measure">
          Nothing about your reading. If you ask, we email it to you. Your email address is kept only if you check the box under
          the email field, and you can ask us to remove it any&nbsp;time. [WHAT WE KEEP: FROM THE NOTICE]
        </p>
      </section>
    </>
  );
}
