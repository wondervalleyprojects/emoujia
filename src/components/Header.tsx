import { motion } from 'motion/react';

export default function Header() {
  return (
    <header className="text-center py-12 flex flex-col items-center gap-2 relative z-10">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-2xl tracking-[0.4em] uppercase"
      >
        EMOUJIA
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs font-mono opacity-50 italic"
      >
        An oracle for your frequently used emoji.
      </motion.p>
    </header>
  );
}
