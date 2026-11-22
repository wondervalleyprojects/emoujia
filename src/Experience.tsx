import { useEffect, useMemo, useRef, useState } from 'react';
import Intro from './components/Intro';
import Crop from './components/Crop';
import Loading from './components/Loading';
import Reading from './components/Reading';
import EmailForm from './components/EmailForm';
import { readGrid, readThree, sendReading, RestingError, TooManyError, CrowdedError, RefusedError, type Reading as ReadingT } from './services/oracle';
import { parseReading } from './lib/grid';
import { shareCardDataUrl, fontsFrom } from './lib/shareCard';
import { readAsDataUrl, loadImage } from './lib/image';

// The whole experience, with no header, footer, masthead, light switch or page
// title of its own: the host page supplies those. Mounted by src/embed.tsx.

type View = 'idle' | 'crop' | 'reading' | 'complete' | 'resting' | 'busy' | 'crowded' | 'error';

export interface ExperienceProps {
  api: string;               // where the API lives, from the mount's data-api
  host: HTMLElement;         // the mount: drop target, and where the fonts are read
  buildHref?: string;        // "Build with the Lab", if the host gives it
  buildLabel?: string;
  fallback: boolean;         // the three-emoji reading, while it waits for approval
}

export default function Experience({ api, host, buildHref, buildLabel, fallback }: ExperienceProps) {
  const [view, setView] = useState<View>('idle');
  const [result, setResult] = useState<ReadingT | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [threeNotice, setThreeNotice] = useState<string | null>(null);
  const [startWithThree, setStartWithThree] = useState(false);
  const [shot, setShot] = useState<{ img: HTMLImageElement; src: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const bracket = useRef<HTMLButtonElement>(null);
  const shown = useRef<View>('idle');
  const lastKind = useRef<'grid' | 'three'>('grid');

  const essence = useMemo(() => parseReading(result?.reading || '').find((s) => s.header === 'THE ESSENCE')?.content.split('\n')[0] || '', [result]);

  // Move focus to each new view's heading, so keyboard and screen reader land
  // on what changed. Never on first load.
  useEffect(() => {
    if (shown.current === view) return;
    shown.current = view;
    if (view === 'idle') (startWithThree ? null : bracket.current)?.focus();
    else heading.current?.focus();
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (err: unknown) => {
    if (err instanceof RestingError) return setView('resting');
    if (err instanceof TooManyError) return setView('busy');
    if (err instanceof CrowdedError) return setView('crowded');
    if (err instanceof RefusedError) {
      setView('idle');
      if (lastKind.current === 'three') { setStartWithThree(true); setThreeNotice(err.message); } else setNotice(err.message);
      return;
    }
    console.error(err);
    setView('error');
  };

  const handleFile = async (file: File) => {
    setNotice(null);
    if (!file.type.startsWith('image/')) { setNotice('That is not an image. Bring a screenshot of your emoji keyboard.'); return; }
    if (file.size > 12 * 1024 * 1024) { setNotice('That image is too large. A plain screenshot will do.'); return; }
    try {
      const src = await readAsDataUrl(file);
      setShot({ img: await loadImage(src), src });
      setView('crop');
    } catch (err: any) { setNotice(err?.message || 'That file could not be read.'); }
  };

  const readImage = async (jpeg: string) => {
    lastKind.current = 'grid';
    setShot(null); setView('reading');
    try {
      const r = await readGrid(api, jpeg);
      if (!r.emojis.length) {
        setView('idle');
        setNotice("The oracle couldn't find a grid in that image. Screenshot the Frequently Used section of your emoji keyboard.");
        return;
      }
      setResult(r); setView('complete');
    } catch (err) { fail(err); }
  };

  const handleThree = async (emojis: string[]) => {
    lastKind.current = 'three';
    setThreeNotice(null); setView('reading');
    try { setResult(await readThree(api, emojis)); setView('complete'); }
    catch (err) { fail(err); }
  };

  useEffect(() => {
    if (view !== 'complete' || !result) return;
    let live = true;
    setCard(null);
    shareCardDataUrl(result.emojis, essence, fontsFrom(host), result.kind === 'three').then((c) => { if (live) setCard(c); });
    return () => { live = false; };
  }, [view, result, essence, host]);

  // Drop a screenshot onto the mount (not the host's whole page).
  useEffect(() => {
    const root = host.shadowRoot?.querySelector('.emoujia') as HTMLElement | null;
    const over = (e: DragEvent) => { e.preventDefault(); if (view === 'idle') root?.classList.add('dropping'); };
    const leave = (e: DragEvent) => { if (!host.contains(e.relatedTarget as Node)) root?.classList.remove('dropping'); };
    const drop = (e: DragEvent) => { e.preventDefault(); root?.classList.remove('dropping'); const f = e.dataTransfer?.files?.[0]; if (f && view === 'idle') handleFile(f); };
    host.addEventListener('dragover', over); host.addEventListener('dragleave', leave); host.addEventListener('drop', drop);
    return () => { host.removeEventListener('dragover', over); host.removeEventListener('dragleave', leave); host.removeEventListener('drop', drop); };
  });

  const reset = (withThree = false) => {
    setResult(null); setCard(null); setShot(null); setNotice(null); setThreeNotice(null);
    setStartWithThree(withThree); setView('idle');
  };

  const sendEmail = async (email: string, optIn: boolean) => {
    if (!result) return { subscribed: false };
    try { return await sendReading(api, result, email, optIn, card); }
    catch (err: any) {
      if (err instanceof TooManyError) throw new Error('That is a lot of emails in a few minutes. Wait a little and try again.');
      throw new Error(err?.message || 'The email did not go out. Try again in a minute.');
    }
  };

  return (
    <>
      {view === 'idle' && (
        <Intro onFile={handleFile} onThree={handleThree} notice={notice} threeNotice={threeNotice} fallback={fallback} startWithThree={startWithThree} bracketRef={bracket} />
      )}
      {view === 'crop' && shot && <Crop img={shot.img} src={shot.src} onRead={readImage} onCancel={() => reset()} headingRef={heading} />}
      {view === 'reading' && <Loading headingRef={heading} />}
      {view === 'complete' && result && (
        <>
          <Reading kind={result.kind} emojis={result.emojis} reading={result.reading} essence={essence} model={result.model} headingRef={heading} />
          <section className="row">
            <h2 className="label">Share card</h2>
            <div className="stack">
              {card
                ? <img className="card-preview" src={card} alt={`Your share card: ruling sign ${result.emojis[0]}, essence: ${essence}`} />
                : <p className="small muted" role="status">Drawing your card.</p>}
              {card
                ? <a className="btn" href={card} download="emoujia-reading.jpg">Download the share card <span className="arrow" aria-hidden="true">→</span></a>
                : <span className="btn" aria-disabled="true">Download the share card <span className="arrow" aria-hidden="true">→</span></span>}
            </div>
          </section>
          <section className="row">
            <h2 className="label">Keep it</h2>
            <EmailForm onSend={sendEmail} />
          </section>
          {result.kind === 'three' && (
            <section className="row">
              <h2 className="label">The full reading</h2>
              <div className="stack-tight">
                {/* PROPOSED */}
                <p className="small measure">Three emoji are a glimpse. Come back with a screenshot of your emoji keyboard for the whole&nbsp;reading.</p>
                <button type="button" className="btn" onClick={() => reset()}>Bring a screenshot <span className="arrow" aria-hidden="true">→</span></button>
              </div>
            </section>
          )}
          <section className="row">
            <h2 className="label sr-only">Next</h2>
            <div className="actions">
              <button type="button" className="textlink" onClick={() => reset(result.kind === 'three')}>{result.kind === 'three' ? 'Read another three' : 'Read another grid'}</button>
              {buildHref && <a className="textlink" href={buildHref}>{buildLabel || 'Build with the Lab'}</a>}
            </div>
          </section>
        </>
      )}
      {view === 'resting' && (
        <section className="row">
          <h2 className="label" ref={heading} tabIndex={-1}>The oracle is resting</h2>
          <div className="stack-tight">
            <p className="essence">The oracle has read all it can for&nbsp;now.</p>
            <p className="small measure">
              {/* PROPOSED, 21 Nov 2026 */}
              Emoujia runs on a small budget, and it is spent for now. It will be back when the studio tops it&nbsp;up.
              The studio stored nothing you&nbsp;sent.
            </p>
            <button type="button" className="textlink" onClick={() => reset()}>Back to the start</button>
          </div>
        </section>
      )}
      {view === 'crowded' && (
        <section className="row">
          <h2 className="label" ref={heading} tabIndex={-1}>One at a time</h2>
          <div className="stack-tight">
            {/* PROPOSED, 21 Nov 2026: the model's company is taking too many requests this minute. */}
            <p className="small measure">The oracle has a queue this minute. Wait a minute, then try again. The studio stored nothing you&nbsp;sent.</p>
            <button type="button" className="textlink" onClick={() => reset()}>Back to the start</button>
          </div>
        </section>
      )}
      {view === 'busy' && (
        <section className="row">
          <h2 className="label" ref={heading} tabIndex={-1}>One at a time</h2>
          <div className="stack-tight">
            {/* PROPOSED */}
            <p className="small measure">That is a lot of readings in a minute. Wait a minute, then try&nbsp;again.</p>
            <button type="button" className="textlink" onClick={() => reset()}>Back to the start</button>
          </div>
        </section>
      )}
      {view === 'error' && (
        <section className="row">
          <h2 className="label" ref={heading} tabIndex={-1}>The oracle is silent</h2>
          <div className="stack-tight">
            <p className="small measure">Something went wrong between here and the machine. Try again in a minute. The studio stored nothing you&nbsp;sent.</p>
            <button type="button" className="textlink" onClick={() => reset()}>Try again</button>
          </div>
        </section>
      )}
    </>
  );
}
