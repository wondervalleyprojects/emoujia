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
          {/* PROPOSED, 21 Nov 2026, from the model Japhy chose: Claude Sonnet only.
              Facts and sources: docs/PRIVACY.md. */}
          <p className="small muted measure" id="privacy">
            The part of the screenshot you send is read by Anthropic's Claude. Anthropic does not train its models on it.
            It keeps it for up to 30 days, may look at it in that time for safety, and keeps it longer only if its checks
            flag it: <a className="textlink" href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data" rel="noopener noreferrer">Anthropic's retention page</a>.
            The studio stores neither the screenshot nor the&nbsp;reading.
          </p>
        </div>
      </section>

      <section className="row" aria-labelledby="emoujia-how">
        <h2 className="label" id="emoujia-how">How</h2>
        {/* iPhone only: no Android keyboard has been tested (Japhy, 21 Nov 2026).
            Everyone else is sent to the three-emoji reading. The last line is PROPOSED. */}
        <ol className="small steps">
          <li>Open your emoji keyboard on your iPhone.</li>
          <li>Screenshot the Frequently Used section, all of it.</li>
          <li>Bring it here. You can crop it before it is sent. The reading takes about half a&nbsp;minute.</li>
        </ol>
        {fallback && <p className="small muted">Not on an iPhone? Enter the three emoji you use most, just&nbsp;below.</p>}
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
                {/* PROPOSED, 21 Nov 2026. */}
                Only the three emoji are sent. They are read by Anthropic's Claude, on the same terms as
                a&nbsp;screenshot.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="row" aria-labelledby="emoujia-keep">
        <h2 className="label" id="emoujia-keep">What we keep</h2>
        <p className="small measure">
          Nothing about your reading. If you ask, we email it to you. Your email address is kept only if you check the box under
          the email field, and you can ask us to remove it any&nbsp;time. [WHAT WE KEEP: AFTER THE SENT MAIL CHECK ON THE PREVIEW]
        </p>
      </section>
    </>
  );
}
