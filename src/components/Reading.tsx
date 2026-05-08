import { motion } from 'motion/react';

interface ReadingProps {
  reading: string;
}

export default function Reading({ reading }: ReadingProps) {
  // Parsing the reading into sections based on the prompt's ALL-CAPS headers
  const sections = reading.split(/(THE RULING SIGN|THE SHADOW|THE READING|YOUR FORECAST|THE ESSENCE)/g);
  
  const parsedSections = [];
  for (let i = 1; i < sections.length; i += 2) {
    const header = sections[i];
    const content = sections[i + 1]?.trim();
    if (header && content && header !== 'THE ESSENCE') {
      parsedSections.push({ header, content });
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-white/20 rounded-tl-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-white/20 rounded-br-[2rem] pointer-events-none" />
        
        <div className="space-y-16">
          {parsedSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="space-y-4 relative"
            >
              <h2 className="font-mono text-xs uppercase tracking-tighter text-[#7b2fc9]">
                {section.header}
              </h2>
              <div className={`leading-relaxed text-lg ${section.header === 'YOUR FORECAST' ? 'text-xl md:text-2xl italic text-white font-medium mb-8' : 'opacity-90 font-serif'}`}>
                 {section.content.split('\n').map((para, k) => (
                   <p key={k} className="mb-4">{para}</p>
                 ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <div className="mt-12 text-[10px] font-mono uppercase tracking-[0.3em] opacity-30 text-center">
        <a href="https://www.wondervalleyprojects.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
          a lab project
        </a>
      </div>
    </div>
  );
}
