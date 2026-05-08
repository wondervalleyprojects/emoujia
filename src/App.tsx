import { useState, useMemo } from 'react';
import Header from './components/Header';
import Upload from './components/Upload';
import EmojiGrid from './components/EmojiGrid';
import Reading from './components/Reading';
import ShareCard from './components/ShareCard';
import { readEmojisFromImage, generateReading } from './services/geminiService';
import { getPalette } from './utils/emojiPalettes';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'idle' | 'uploading' | 'reading_emojis' | 'generating_reading' | 'complete' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [reading, setReading] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (base64: string) => {
    setScreenshot(base64);
    setState('reading_emojis');
    setError(null);

    try {
      const detectedEmojis = await readEmojisFromImage(base64);
      if (detectedEmojis.length === 0) {
        setState('error');
        setError("The oracle couldn't read this grid. Make sure you've screenshotted the Frequently Used section of your emoji keyboard.");
        return;
      }
      setEmojis(detectedEmojis);
      
      setState('generating_reading');
      const textReading = await generateReading(detectedEmojis);
      setReading(textReading);
      setState('complete');
    } catch (err) {
      console.error(err);
      setState('error');
      setError("The oracle is silent. Try again later.");
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

  const loadingText = useMemo(() => {
    if (state === 'reading_emojis') return "Reading the grid…";
    if (state === 'generating_reading') return "Finding the pattern…";
    return "The oracle considers…";
  }, [state]);

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
                   className="font-mono text-sm tracking-[0.2em] uppercase"
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
               rulingEmoji={emojis[0]} 
               grid={emojis} 
               forecast={forecast} 
               essence={essence}
               palette={palette} 
             />
             <div className="flex justify-center">
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
