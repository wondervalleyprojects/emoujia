import React, { useState } from 'react';

interface Props { onSend: (email: string, optIn: boolean) => Promise<void> }

export default function EmailForm({ onSend }: Props) {
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('sending'); setError(null);
    try { await onSend(email, optIn); setStatus('sent'); }
    catch (err: any) { setStatus('error'); setError(err?.message || 'The email did not go out. Try again in a minute.'); }
  };

  if (status === 'sent') {
    return <p role="status">Sent. Check your inbox. The reading is gone from here.</p>;
  }
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <label htmlFor="email" className="small">Your email address</label>
      <input id="email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="check small">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        <span>
          Subscribe for more information.
          <span className="muted" style={{ display: 'block' }}>We keep your email only if you check this. Your reading is sent, then not&nbsp;kept.</span>
        </span>
      </label>
      <div>
        <button type="submit" className="btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending' : 'Email me my reading'} <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>
      {status === 'error' && <p className="small" role="alert">{error}</p>}
    </form>
  );
}
