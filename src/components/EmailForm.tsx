import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Check, Loader2, Send } from 'lucide-react';

interface EmailFormProps {
  onSend: (email: string, optIn: boolean) => Promise<void>;
}

export default function EmailForm({ onSend }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(true);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('sending');
    setError(null);

    try {
      await onSend(email, optIn);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err?.message || "Something went wrong. The oracle's messengers are tied up.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-12 mb-24">
      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#7b2fc9]/20 rounded-lg">
          <Mail className="w-5 h-5 text-[#7b2fc9]" />
        </div>
        <div>
          <h3 className="text-sm font-mono uppercase tracking-widest text-[#7b2fc9]">Preserve the Omens</h3>
          <p className="text-xs opacity-50 font-mono tracking-tighter">Email me my reading and share card</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-serif italic text-white/90">The courier is on their way. Check your inbox.</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <input
                type="email"
                required
                placeholder="messenger@oracle.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#7b2fc9]/50 transition-colors font-mono"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  checked={optIn}
                  onChange={(e) => setOptIn(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded border border-white/20 checked:bg-[#7b2fc9] checked:border-[#7b2fc9] transition-all"
                />
                <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-[11px] opacity-50 group-hover:opacity-80 transition-opacity leading-tight font-mono tracking-tighter">
                I would like to receive more information and updates from the Lab.
              </span>
            </label>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full flex items-center justify-center gap-2 bg-[#7b2fc9] hover:bg-[#8e44e0] disabled:opacity-50 disabled:hover:bg-[#7b2fc9] text-white py-4 rounded-xl text-xs font-mono uppercase tracking-[0.2em] transition-colors"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Summoning Messengers...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Reading
                </>
              )}
            </button>

            {status === 'error' && (
              <p className="text-[10px] text-red-400 font-mono text-center">{error}</p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}
