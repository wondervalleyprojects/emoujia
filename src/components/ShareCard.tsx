import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Palette } from '../utils/emojiPalettes';
import { motion } from 'motion/react';

interface ShareCardProps {
  rulingEmoji: string;
  grid: string[];
  forecast: string;
  palette: Palette;
}

export default function ShareCard({ rulingEmoji, grid, forecast, palette }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const appUrl = import.meta.env.VITE_APP_URL || 'emoujia.app';

  const downloadImage = async () => {
    if (!cardRef.current) return;
    
    // Temporarily show the card in full size for rendering
    const card = cardRef.current;
    
    try {
      const canvas = await html2canvas(card, {
        width: 1080,
        height: 1080,
        scale: 1,
        backgroundColor: palette.bg,
      });
      
      const link = document.createElement('a');
      link.download = 'emoujia-reading.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to share", err);
    }
  };

  return (
    <div className="flex flex-col items-center py-12">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={downloadImage}
        className="px-10 py-3 rounded-full border border-[#7b2fc9] bg-[#7b2fc9]/10 text-xs font-mono uppercase tracking-widest hover:bg-[#7b2fc9]/30 transition-all transition-colors mb-8"
      >
        Generate Share Card
      </motion.button>

      {/* Hidden card for html2canvas to capture */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div 
          ref={cardRef}
          style={{ 
            width: '1080px', 
            height: '1080px', 
            backgroundColor: palette.bg,
            color: palette.text,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '80px',
            fontFamily: '"Lora", serif',
            border: `20px solid ${palette.accent}22`,
            boxSizing: 'border-box'
          }}
        >
          <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '24px', letterSpacing: '0.4em', opacity: 0.7 }}>
            EMOUJIA
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px', width: '100%', position: 'relative' }}>
            
            {/* The Reading Focus */}
            <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.4em', opacity: 0.5, marginBottom: '20px' }}>
                 Your Forecast
               </div>
               <div style={{ textAlign: 'center', fontSize: '48px', lineHeight: '1.3', maxWidth: '850px', fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em', color: '#ffffff' }}>
                 "{forecast || 'The oracle is considering your path.'}"
               </div>
            </div>

            {/* Focal Emoji */}
            <div style={{ fontSize: '240px', filter: 'drop-shadow(0 0 50px rgba(255,255,255,0.15))', margin: '20px 0' }}>
              {rulingEmoji}
            </div>

            {/* Grid Preview */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '44px', justifyContent: 'center', opacity: 0.4 }}>
              {grid.slice(1, 9).map((e, i) => (
                <span key={i}>{e}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '18px', letterSpacing: '0.2em', opacity: 0.4 }}>
              {appUrl.replace('https://', '').replace('http://', '')}
            </div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '12px', letterSpacing: '0.1em', opacity: 0.2 }}>
              A WONDER VALLEY PROJECTS LAB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
