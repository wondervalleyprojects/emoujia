// The embeddable build: one script and one stylesheet at fixed names,
//   dist/embed/emoujia.js   (all of React and the experience, one file)
//   dist/embed/emoujia.css  (src/experience.css, loaded inside the shadow root)
// No hashed names for the site to chase; netlify.toml gives them a short cache.
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { fallbackOn } from './scripts/flags.mjs';

// The stylesheet is plain CSS, written by hand, so it ships as written.
const stylesheet = (): Plugin => ({
  name: 'emoujia-stylesheet',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'emoujia.css', source: readFileSync('src/experience.css', 'utf8') });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), stylesheet()],
  define: {
    __EMOUJIA_FALLBACK__: JSON.stringify(fallbackOn(mode)),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  publicDir: false,
  build: {
    outDir: 'dist/embed',
    emptyOutDir: false,
    lib: { entry: 'src/embed.tsx', name: 'Emoujia', formats: ['iife'], fileName: () => 'emoujia.js' },
    target: 'es2020',
  },
}));
