import { useRef } from 'react';

interface Props { onFile: (file: File) => void; notice: string | null }

export default function Intro({ onFile, notice }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="masthead" style={{ marginTop: 24 }}>
        <p className="label">Wonder Valley Projects Lab</p>
        <p className="label">Emoujia</p>
        <p className="label">Read by a machine<br />Kept by no&nbsp;one</p>
      </div>

      <h1 className="hero-title">What do your emojis say about&nbsp;you?</h1>
      <p className="lede">
        Emoujia reads the Frequently Used section of your emoji keyboard the way a palmist reads a hand.
        Atmospheric, psychologically acute, slightly&nbsp;unnerving.
      </p>

      <div style={{ margin: '32px 0 8px' }}>
        <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
        <button type="button" className="bracket" aria-label="Your part: read my emoji. Choose a screenshot of your emoji keyboard."
          onClick={() => input.current?.click()}>
          <span>[Read my emoji]</span>
        </button>
        <p className="small muted">Or drop the screenshot anywhere on this&nbsp;page.</p>
        {notice && <p className="small" role="alert" style={{ marginTop: 8 }}>{notice}</p>}
      </div>

      {/* Logged exception (EMJ-001, 1 Nov 2026): free Gemini tier, disclosed here. */}
      <p className="small muted" id="privacy" style={{ maxWidth: '36em' }}>
        Your screenshot is read by Google's Gemini, which may use it to improve its models. We keep&nbsp;nothing.
      </p>

      <section className="row" style={{ marginTop: 32 }}>
        <h2 className="label">How</h2>
        <ol className="small" style={{ listStyle: 'decimal', paddingLeft: '1.2em', display: 'grid', gap: 4 }}>
          <li>Open your emoji keyboard on your phone.</li>
          <li>Screenshot the Frequently Used section, all of it.</li>
          <li>Bring it here. The reading takes about half a&nbsp;minute.</li>
        </ol>
      </section>
      <section className="row">
        <h2 className="label">What we keep</h2>
        <p className="small">
          Nothing about your reading. If you ask, we email it to you and forget it. Your email address is kept only if
          you check "Subscribe for more information," and you can ask us to remove it any&nbsp;time.
        </p>
      </section>
    </>
  );
}
