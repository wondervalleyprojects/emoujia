import { useRef, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import { Palette } from '../utils/emojiPalettes';
import { motion } from 'motion/react';

interface ShareCardProps {
  rulingEmoji: string;
  grid: string[];
  forecast: string;
  essence: string;
  palette: Palette;
}

export interface ShareCardHandle {
  capture: () => Promise<string | null>;
  download: () => Promise<void>;
}

const ShareCard = forwardRef<ShareCardHandle, ShareCardProps>(({ rulingEmoji, grid, forecast, essence, palette }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const appUrl = import.meta.env.VITE_APP_URL || 'emoujia.app';

  const captureImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      const canvas = await html2canvas(cardRef.current, {
        width: 1080,
        height: 1080,
        scale: 1,
        backgroundColor: palette.bg,
        logging: false,
        useCORS: true
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error("Failed to capture image", err);
      return null;
    }
  };

  const downloadImage = async () => {
    const dataUrl = await captureImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = 'emoujia-reading.png';
      link.href = dataUrl;
      link.click();
    }
  };

  useImperativeHandle(ref, () => ({
    capture: captureImage,
    download: downloadImage
  }));

  return (
    <div className="flex flex-col items-center py-12">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={downloadImage}
        className="px-10 py-3 rounded-full border border-[#7b2fc9] bg-[#7b2fc9]/10 text-xs font-mono uppercase tracking-widest hover:bg-[#7b2fc9]/30 transition-all transition-colors mb-8"
      >
        Download Share Card
      </motion.button>

      {/* Hidden card for html2canvas to capture */}
      <div id="share-card-container" className="fixed left-[-9999px] top-0 pointer-events-none">
        <div 
          id="share-card-canvas"
          ref={cardRef}
          style={{ 
            width: '1080px', 
            height: '1080px', 
            background: `radial-gradient(circle at 50% 50%, ${palette.bg}, ${palette.bg} 40%, ${palette.accent}22 100%)`,
            color: palette.text,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '80px',
            fontFamily: '"Lora", serif',
            border: `20px solid ${palette.accent}44`,
            boxSizing: 'border-box'
          }}
        >
          <div id="share-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '32px', letterSpacing: '0.4em', opacity: 0.7 }}>
              EMOUJIA
            </div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '14px', letterSpacing: '0.2em', opacity: 0.4, marginTop: '10px', textAlign: 'center' }}>
              AN ORACLE FOR YOUR FREQUENTLY USED EMOJI
            </div>
          </div>

          {/* Content Area */}
          <div id="share-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '60px', width: '100%', position: 'relative' }}>
            
            {/* Focal Emoji Group - Locked Up */}
            <div id="share-card-focal-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.6em', opacity: 0.6, marginBottom: '5px' }}>
                The Ruling Sign
              </div>
              <div style={{ fontSize: '360px', filter: 'drop-shadow(0 0 60px rgba(255,255,255,0.1))', lineHeight: '1', marginTop: '-20px' }}>
                {rulingEmoji}
              </div>
            </div>

            {/* The Essence */}
            <div id="share-card-essence" style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ textAlign: 'center', fontSize: '48px', lineHeight: '1.2', maxWidth: '900px', fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em', color: '#ffffff' }}>
                 "{essence || forecast || 'The oracle is considering your path.'}"
               </div>
            </div>

            {/* Grid Preview */}
            <div id="share-card-grid-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '48px', justifyContent: 'center', opacity: 0.4 }}>
              {grid.slice(1, 9).map((e, i) => (
                <span key={i}>{e}</span>
              ))}
            </div>
          </div>

          <div id="share-card-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '20px', letterSpacing: '0.2em', opacity: 0.4 }}>
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
});

export default ShareCard;
