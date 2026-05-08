import { motion } from 'motion/react';

interface EmojiGridProps {
  emojis: string[];
}

export default function EmojiGrid({ emojis }: EmojiGridProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-4">
      <div className="mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Your Detected Grid</span>
      </div>
      <div className="flex flex-wrap gap-4 text-3xl md:text-4xl justify-center py-6 px-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        {emojis.map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 opacity-50"></div>
    </div>
  );
}
