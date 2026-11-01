# Architecture

A single-page React app on Netlify, with two serverless functions.

```
browser (React, Vite)
  ├─ POST /api/analyze ──────► netlify/functions/api.ts ──► Gemini API
  ├─ POST /api/send-reading ─► netlify/functions/api.ts ──► Gmail (SMTP), Firestore (subscribers, opt-in only)
  └─ GET  /api/admin/export-subscribers (Bearer EXPORT_SECRET)
netlify/functions/export-subscribers.mts  (scheduled, 1st and 15th) ──► Firestore ──► CSV by email
```

## Front end (`src/`)

| File | What it does |
| --- | --- |
| `App.tsx` | The four views (idle, reading, complete, resting or error), file handling, drop anywhere, the email call. Shrinks the screenshot to 1024px JPEG before upload. |
| `components/Header.tsx`, `Footer.tsx` | The bug and name; footer links and the Auto, Day, Night switch. |
| `components/Intro.tsx` | The first screen: masthead, hero, the invitation bracket, the Gemini disclosure, how, what we keep. |
| `components/Loading.tsx` | The waiting log. |
| `components/Reading.tsx` | The reading: band, masthead, ruling sign, essence, grid, casing, sections. |
| `components/TraceBand.tsx` | The Emoujia pattern as SVG, plotted once. |
| `components/EmailForm.tsx` | Email field and the unchecked "Subscribe for more information." |
| `components/RecordLine.tsx` | The Record line with its screen reader label. |
| `lib/grid.ts` | Emoji splitting, trace steps, date format, reading parser. |
| `lib/shareCard.ts` | Draws the 1080 share card on a canvas. |
| `services/geminiService.ts` | Calls `/api/analyze`; turns quota errors into the resting message. |
| `index.css` | Public Wonder tokens and every style. Tailwind is imported only for its reset. |

## Server (`server/`, `netlify/functions/`)

| File | What it does |
| --- | --- |
| `netlify/functions/api.ts` | Express app behind `serverless-http`. `/analyze` holds the reading prompt and tries `gemini-2.5-flash`, then `gemini-3.5-flash`; returns `{ emojis, reading, model }`. `/send-reading` saves the subscriber only on opt-in, then sends the email with SMTP fallbacks. |
| `netlify/functions/export-subscribers.mts` | Scheduled function, `0 16 1,15 * *` UTC. |
| `server/store.ts` | The only database code. Admin SDK when the service account is set, client SDK otherwise. Export auth. |
| `server/readingEmail.ts` | The reading email: plain, no styling, studio sign-off. |
| `server.ts` | Local development server: the same API plus Vite. `npm run dev`. |

The reading prompt lives in both `server.ts` and `netlify/functions/api.ts`. Change both, or better, move it to `server/` first.

## Data

Firestore holds one collection, `subscribers/{email}` with `email`, `subscribedAt`, `source`. `firestore.rules` denies everything else. There is no readings collection.

## Build

`npm run build` runs `scripts/fetch-fonts.mjs` (pulls Shapiro from a private repo when the token is set) and then `vite build` into `dist/`. `netlify.toml` routes `/api/*` to the function and ships `firebase-admin` unbundled.
