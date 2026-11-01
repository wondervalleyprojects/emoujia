import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Intro from './components/Intro';
import Loading from './components/Loading';
import Reading from './components/Reading';
import EmailForm from './components/EmailForm';
import Footer from './components/Footer';
import RecordLine from './components/RecordLine';
import { generateFullReading, RestingError } from './services/geminiService';
import { parseReading, splitEmoji } from './lib/grid';
import { shareCardDataUrl } from './lib/shareCard';

type View = 'idle' | 'reading' | 'complete' | 'resting' | 'error';

// Shrinks the screenshot before it leaves the phone.
function toJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image we can read.'));
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [view, setView] = useState<View>('idle');
  const [emojis, setEmojis] = useState<string[]>([]);
  const [reading, setReading] = useState('');
  const [model, setModel] = useState('');
  const [card, setCard] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);

  const essence = useMemo(() => parseReading(reading).find((s) => s.header === 'THE ESSENCE')?.content.split('\n')[0] || '', [reading]);

  const handleFile = async (file: File) => {
    setNotice(null);
    if (!file.type.startsWith('image/')) { setNotice('That is not an image. Bring a screenshot of your emoji keyboard.'); return; }
    if (file.size > 12 * 1024 * 1024) { setNotice('That image is too large. A plain screenshot will do.'); return; }
    setView('reading'); window.scrollTo(0, 0);
    try {
      const image = await toJpeg(file);
      const result = await generateFullReading(image);
      const found = splitEmoji(result.emojis);
      if (!found.length) {
        setView('idle');
        setNotice("The oracle couldn't find a grid in that image. Screenshot the Frequently Used section of your emoji keyboard.");
        return;
      }
      setEmojis(found); setReading(result.reading); setModel(result.model || ''); setView('complete'); window.scrollTo(0, 0);
    } catch (err) {
      if (err instanceof RestingError) { setView('resting'); return; }
      console.error(err);
      setView('error');
    }
  };

  useEffect(() => {
    if (view !== 'complete') return;
    setCard(null);
    shareCardDataUrl(emojis, essence).then(setCard);
  }, [view, emojis, essence]);

  // Drop a screenshot anywhere on the page.
  useEffect(() => {
    const over = (e: DragEvent) => { e.preventDefault(); if (view === 'idle') setDropping(true); };
    const leave = (e: DragEvent) => { if (!e.relatedTarget) setDropping(false); };
    const drop = (e: DragEvent) => { e.preventDefault(); setDropping(false); const f = e.dataTransfer?.files?.[0]; if (f && view === 'idle') handleFile(f); };
    window.addEventListener('dragover', over); window.addEventListener('dragleave', leave); window.addEventListener('drop', drop);
    return () => { window.removeEventListener('dragover', over); window.removeEventListener('dragleave', leave); window.removeEventListener('drop', drop); };
  });

  const sendEmail = async (email: string, optIn: boolean) => {
    const response = await fetch('/api/send-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, readingText: reading, essence, shareCardImage: card, optIn }),
    });
    if (!response.ok) {
      let message = 'The email did not go out. Try again in a minute.';
      try { message = (await response.json()).error || message; } catch { /* not JSON */ }
      throw new Error(message);
    }
  };

  const reset = () => { setView('idle'); setEmojis([]); setReading(''); setModel(''); setCard(null); window.scrollTo(0, 0); };

  return (
    <div className={`page${dropping ? ' dropping' : ''}`}>
      <Header />
      <main>
        {view === 'idle' && <Intro onFile={handleFile} notice={notice} />}
        {view === 'reading' && <Loading />}
        {view === 'complete' && (
          <>
            <Reading emojis={emojis} reading={reading} essence={essence} model={model} />
            <section className="row">
              <h2 className="label">Share card</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                {card
                  ? <img className="card-preview" src={card} alt={`Your share card: ruling sign ${emojis[0]}, essence: ${essence}`} />
                  : <p className="small muted">Drawing your card.</p>}
                <div>
                  <a className="btn" href={card || undefined} download="emoujia-reading.jpg" aria-disabled={!card}>
                    Download the share card <span className="arrow" aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </section>
            <section className="row">
              <h2 className="label">Keep it</h2>
              <EmailForm onSend={sendEmail} />
            </section>
            <p style={{ padding: '16px 0' }}><button type="button" className="textlink" onClick={reset}>Read another grid</button></p>
            <RecordLine />
          </>
        )}
        {view === 'resting' && (
          <section className="row" style={{ marginTop: 24 }}>
            <h2 className="label">The oracle is resting</h2>
            <div>
              <p className="essence" style={{ maxWidth: '22ch' }}>The oracle has read all it can for&nbsp;today.</p>
              <p className="small" style={{ marginTop: 16, maxWidth: '36em' }}>
                Emoujia runs on a free allowance from Google, and today's is spent. It comes back on its own. Try again tomorrow.
                Nothing you sent was&nbsp;kept.
              </p>
              <p style={{ marginTop: 16 }}><button type="button" className="textlink" onClick={reset}>Back to the start</button></p>
            </div>
          </section>
        )}
        {view === 'error' && (
          <section className="row" style={{ marginTop: 24 }}>
            <h2 className="label">The oracle is silent</h2>
            <div>
              <p className="small" style={{ maxWidth: '36em' }}>Something went wrong between here and the machine. Try again in a minute. Nothing you sent was&nbsp;kept.</p>
              <p style={{ marginTop: 16 }}><button type="button" className="textlink" onClick={reset}>Try again</button></p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
