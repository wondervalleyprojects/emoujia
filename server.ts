// Local development: the same API as production (server/api.ts) plus Vite.
// npm run dev, then http://localhost:3000
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { apiRouter } from './server/api';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.disable('x-powered-by');

  // Method and path only. Never bodies.
  app.use((req, _res, next) => { console.log(`${new Date().toISOString()} ${req.method} ${req.path}`); next(); });

  const api = apiRouter();
  app.use('/api', api);

  if (process.env.NODE_ENV !== 'production') {
    // The page asks for the embed's stylesheet by its served name.
    app.get('/embed/emoujia.css', (_req, res) => res.type('text/css').sendFile(path.join(__dirname, 'src', 'experience.css')));
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'mpa' });
    app.use(vite.middlewares);
  } else {
    // Production preview (npm run build, then NODE_ENV=production npm run dev):
    // the same rewrites and headers netlify.toml and scripts/postbuild.mjs set,
    // so the stub host page can be checked here under its policy.
    const dist = path.join(__dirname, 'dist');
    app.use('/stub', (_req, res, next) => {
      res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
      res.set('X-Robots-Tag', 'noindex, nofollow');
      next();
    });
    app.use('/stub/lab/emoujia/api', api);
    app.get('/stub/lab/emoujia/embed.js', (_req, res) => res.set('Cache-Control', 'public, max-age=300').sendFile(path.join(dist, 'embed', 'emoujia.js')));
    app.get('/stub/lab/emoujia/embed.css', (_req, res) => res.set('Cache-Control', 'public, max-age=300').sendFile(path.join(dist, 'embed', 'emoujia.css')));
    app.use('/embed', express.static(path.join(dist, 'embed'), { maxAge: 300_000 }));
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
