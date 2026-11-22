import React, { useState } from 'react';

interface Props { onSend: (email: string, optIn: boolean) => Promise<{ subscribed?: boolean }> }

export default function EmailForm({ onSend }: Props) {
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  // The box was checked and the server says the address was not saved.
  const [notSaved, setNotSaved] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [savedOnRetry, setSavedOnRetry] = useState(false);

  // Returns true when a checked box's address was saved.
  const send = async (subscribe: boolean) => {
    const out = await onSend(email, subscribe);
    // Only a plain false counts: an older server does not answer `subscribed`.
    setNotSaved(subscribe && out?.subscribed === false);
    return subscribe && out?.subscribed === true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'sending') return;
    setStatus('sending'); setError(null);
    try { await send(optIn); setStatus('sent'); }
    catch (err: any) { setStatus('error'); setError(err?.message || 'The email did not go out. Try again in a minute.'); }
  };

  // Try the save again. There is no route that only subscribes, so this sends
  // the reading again too, and the words say so.
  const retry = async () => {
    if (retrying) return;
    setRetrying(true); setError(null);
    try { setSavedOnRetry(await send(true)); }
    catch (err: any) { setError(err?.message || 'That did not go through. Try again in a minute.'); }
    finally { setRetrying(false); }
  };

  if (status === 'sent') {
    return (
      <div className="stack-tight">
        <p role="status">Sent. Check your inbox. The reading is gone from here.</p>
        {notSaved && (
          <div className="stack-tight" role="alert">
            {/* PROPOSED, 21 Nov 2026: a checked box whose save failed. The box must do what it says, or say it could not. */}
            <p className="small measure">
              Your address could not be saved for news of new labs, so you are not on that list. Trying again sends the reading a second&nbsp;time.
            </p>
            <button type="button" className="textlink" onClick={retry} aria-disabled={retrying}>
              {retrying ? 'Trying again' : 'Try again to subscribe'}
            </button>
          </div>
        )}
        {savedOnRetry && <p className="small" role="status">{/* PROPOSED */}Saved this time. You are on the list for new labs.</p>}
        {error && <p className="small" role="alert">{error}</p>}
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="stack">
      <label htmlFor="emoujia-email" className="small">Your email address</label>
      <input id="emoujia-email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="check small">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        {/* PROPOSED label (Japhy, 20 Nov 2026), to approve or replace. It must say exactly what happens to the address.
            Second line's last sentence PROPOSED, 21 Nov 2026 (Sent Mail cleared daily). */}
        <span>
          Tell me about new labs. It comes from Japhy Grant's Substack, a few times a year, along with his other&nbsp;writing.
          <span className="muted block">We keep your email only if you check this. Otherwise it goes when the studio's copy of this email is deleted, within a&nbsp;day.</span>
        </span>
      </label>
      <div>
        <button type="submit" className="btn" aria-disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending' : 'Email me my reading'} <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>
      {status === 'error' && <p className="small" role="alert">{error}</p>}
    </form>
  );
}
