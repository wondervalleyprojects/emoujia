// The standalone page (emoujia.com). The embed has its own build:
// vite.embed.config.ts. `npm run build` makes both.
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { fallbackOn } from './scripts/flags.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: { __EMOUJIA_FALLBACK__: JSON.stringify(fallbackOn(mode)) },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
}));
