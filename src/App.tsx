import { useState, useMemo, useRef } from 'react';
import Header from './components/Header';
import Upload from './components/Upload';
import EmojiGrid from './components/EmojiGrid';
import Reading from './components/Reading';
import ShareCard, { ShareCardHandle } from './components/ShareCard';
import EmailForm from './components/EmailForm';
import { generateFullReading } from './services/geminiService';
import { getPalette } from './utils/emojiPalettes';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'idle' | 'uploading' | 'reading_emojis' | 'generating_reading' | 'complete' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [reading, setReading] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const shareCardRef = useRef<ShareCardHandle>(null);

  const handleUpload = async (base64: string) => {
    setScreenshot(base64);
    setState('generating_reading'); // Combined state
    setError(null);

    try {
      const { emojis: detectedEmojis, reading: textReading } = await generateFullReading(base64);
      
      if (detectedEmojis.length === 0) {
        setState('error');
        setError("The oracle couldn't read this grid. Make sure you've screenshotted the Frequently Used section of your emoji keyboard.");
        return;
      }
      
      setEmojis(detectedEmojis);
      setReading(textReading);
      setState('complete');
    } catch (err: any) {
      console.error(err);
      setState('error');
      
      const errorMessage = err?.message || String(err);
      if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('429')) {
        setError("The oracle's energy is depleted (Quota reached). This is a limit of the free Gemini API. It usually resets within a few hours or a day.");
      } else {
        setError("The oracle is silent. There may be a connection issue or the grid was unreadable. " + (errorMessage ? `(${errorMessage})` : "Try again later."));
      }
    }
  };

  const handleSendEmail = async (email: string, optIn: boolean) => {
    const shareCardImage = await shareCardRef.current?.capture();
    
    const response = await fetch('/api/send-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        readingText: reading,
        essence,
        shareCardImage,
        optIn
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send email');
    }
  };

  const palette = useMemo(() => {
    if (emojis.length > 0) return getPalette(emojis[0]);
    return getPalette('');
  }, [emojis]);

  const forecast = useMemo(() => {
    const match = reading.match(/YOUR FORECAST\n([\s\S]*?)(?=\n\n(?:THE ESSENCE|---)|$)/i);
    return match ? match[1].trim() : '';
  }, [reading]);

  const essence = useMemo(() => {
    const match = reading.match(/THE ESSENCE\n([\s\S]*?)(?=\n---|$)/i);
    return match ? match[1].trim() : '';
  }, [reading]);

  const loadingPhrases = [
    "Reading the grid...",
    "Consulting the archives...",
    "Mapping the emotional frequency...",
    "Reticulating Splines...",
    "Making the Connections...",
    "Folded Hands Emoji...",
    "Texting the spirits...",
    "Deciphering the unspoken...",
    "Tracing the digital patterns...",
    "Sifting through the symbols..."
  ];

  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  // Rotate loading phrases every 2.5 seconds
  useMemo(() => {
    if (state === 'reading_emojis' || state === 'generating_reading') {
      const interval = setInterval(() => {
        setLoadingPhraseIndex(prev => (prev + 1) % loadingPhrases.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [state]);

  const loadingText = useMemo(() => {
    if (state === 'reading_emojis') return "Accessing the oracle...";
    return loadingPhrases[loadingPhraseIndex];
  }, [state, loadingPhraseIndex]);

  const reset = () => {
    setState('idle');
    setEmojis([]);
    setReading('');
    setScreenshot(null);
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-1000 relative"
      style={{ backgroundColor: palette.bg, color: palette.text }}
    >
      {/* Immersive background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-glow-top opacity-20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-glow-bottom opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Header />
        <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Upload onUpload={handleUpload} isLoading={false} />
          </motion.div>
        )}

        {(state === 'reading_emojis' || state === 'generating_reading') && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center p-8 bg-black/40 z-50 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm aspect-[9/16] relative mb-12 overflow-hidden rounded-xl border border-white/10">
              {screenshot && <img src={screenshot} alt="Uploading" className="w-full h-full object-cover opacity-30 grayscale" />}
              <div className="absolute inset-0 flex items-center justify-center">
                 <motion.div
                   animate={{ opacity: [0.4, 1, 0.4] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="font-mono text-sm tracking-[0.2em] uppercase text-center px-4"
                 >
                   {loadingText}
                 </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-24 pt-12"
          >
             <EmojiGrid emojis={emojis} />
             <div className="w-full max-w-2xl mx-auto px-4 h-px bg-white/5 my-8" />
             <Reading reading={reading} />
             <ShareCard 
               ref={shareCardRef}
               rulingEmoji={emojis[0]} 
               grid={emojis} 
               forecast={forecast} 
               essence={essence}
               palette={palette} 
             />
             <EmailForm onSend={handleSendEmail} />
             <div className="flex justify-center pb-12">
               <button 
                 onClick={reset}
                 className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40 hover:opacity-80 transition-opacity"
               >
                 Start Over
               </button>
             </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen text-center px-4"
          >
            <p className="max-w-md mb-8 opacity-80 leading-relaxed italic">{error}</p>
            <button 
              onClick={reset}
              className="px-8 py-3 rounded-full font-mono uppercase tracking-widest text-sm border border-white/20 hover:bg-white hover:text-black transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
