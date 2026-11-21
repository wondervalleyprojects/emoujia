import React, { useState } from 'react';

interface Props { onSend: (email: string, optIn: boolean) => Promise<void> }

export default function EmailForm({ onSend }: Props) {
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'sending') return;
    setStatus('sending'); setError(null);
    try { await onSend(email, optIn); setStatus('sent'); }
    catch (err: any) { setStatus('error'); setError(err?.message || 'The email did not go out. Try again in a minute.'); }
  };

  if (status === 'sent') {
    return <p role="status">Sent. Check your inbox. The reading is gone from here.</p>;
  }
  return (
    <form onSubmit={submit} className="stack">
      <label htmlFor="emoujia-email" className="small">Your email address</label>
      <input id="emoujia-email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="check small">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        {/* PROPOSED label (Japhy, 20 Nov 2026), to approve or replace. It must say exactly what happens to the address. */}
        <span>
          Tell me about new labs. It comes from Japhy Grant's Substack, a few times a year, along with his other&nbsp;writing.
          <span className="muted block">We keep your email only if you check this. [WHAT HAPPENS TO THE READING EMAIL: FROM THE NOTICE]</span>
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
