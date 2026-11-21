# Architecture

One Netlify project with two builds (a standalone page and an embed) and two serverless functions. From 0.3.0 the experience is written once, as an embed, and emoujia.com is simply its first host page. The studio site is the second. The contract with the site is [Integration](INTEGRATION.md).

```
host page (emoujia.com, or wondervalleyprojects.com/lab/emoujia/ by rewrite)
  └─ <div data-emoujia data-api=… data-css=…>  ← /embed/emoujia.js mounts the experience in its shadow root
       ├─ POST {api}/analyze ──────► netlify/functions/api.ts ─► Gemini   (screenshot, cropped in the browser)
       ├─ POST {api}/read-three ───► netlify/functions/api.ts ─► Gemini   (three checked emoji, nothing else)
       └─ POST {api}/send-reading ─► netlify/functions/api.ts ─► Gmail (SMTP); Firestore only on opt-in
GET /api/admin/export-subscribers (Bearer EXPORT_SECRET)
netlify/functions/export-subscribers.mts (scheduled, 1st and 15th) ─► Firestore ─► CSV by email
```

## Front end (`src/`)

| File | What it does |
| --- | --- |
| `embed.tsx` | Finds each `[data-emoujia]`, reads `data-api`, `data-css`, `data-build-href`, `data-build-label`, attaches a shadow root, loads the stylesheet into it, renders `Experience`. |
| `Experience.tsx` | The views: invitation, crop, the waiting log, the reading, resting, too many, error. File handling, drop onto the mount, focus moved to each new view's heading, the share card, the email call. No header, footer, masthead or title of its own. |
| `experience.css` | Every style of the experience, scoped by the shadow root. Site token names, each with a fallback. Shipped as written to `/embed/emoujia.css`. |
| `standalone.ts`, `standalone.css` | emoujia.com as a host: fonts, tokens, the Auto, Day, Night switch, and the footer's Privacy link reaching into the mount. The page itself is plain HTML in `index.html`. |
| `components/Intro.tsx` | The invitation bracket, the three steps (iPhone only for now), the notice, the no-screenshot line, what we keep. |
| `components/Crop.tsx` | Crop the screenshot before it is sent: drag the box or a corner; arrow keys move it, Shift and arrow keys size it. |
| `components/ThreeForm.tsx` | The fallback field: three emoji from the person's own keyboard, counted as they type. |
| `components/Loading.tsx` | The waiting log. |
| `components/Reading.tsx` | Band, masthead strip, ruling sign, essence, grid, casing line, sections, Record line. A three-emoji reading says it is the short one. |
| `components/TraceBand.tsx` | The Emoujia pattern as SVG, plotted once. |
| `components/EmailForm.tsx` | Email field and the unchecked subscribe box. |
| `components/RecordLine.tsx` | The Record line with its screen reader label. |
| `lib/emoji.ts` | The three-emoji check, shared with the server so the browser and the server agree. |
| `lib/image.ts` | Reads the file as a data URL, crops and shrinks it to a 1024 px JPEG. |
| `lib/grid.ts` | Emoji splitting, trace steps, date format, reading parser (also used by the server). |
| `lib/shareCard.ts` | Draws the 1080 share card on a canvas, with the host's fonts read from the mount. |
| `services/oracle.ts` | Calls the API at the mount's `data-api`; turns 429s into the resting or too-many views. |

## Server (`server/`, `netlify/functions/`)

| File | What it does |
| --- | --- |
| `server/api.ts` | Every route, once: `/analyze`, `/read-three`, `/send-reading`, `/admin/export-subscribers`. Body limits, the `{ error, code }` answers. Both servers mount it. |
| `server/prompts.ts` | The grid prompt (moved here unchanged from the two servers) and the fallback prompt (PROPOSED). |
| `server/readings.ts` | Calls Gemini, trying the models in `GEMINI_MODELS` in order; names the model from Google's answer; tells a spent allowance from other failures. |
| `server/sign.ts` | Signs each reading (HMAC) and checks the signature when it comes back to be emailed. Stores nothing. |
| `server/mailer.ts` | Sends through Gmail, three ways, then without the card. |
| `server/readingEmail.ts` | The reading email: plain, no styling, studio sign-off. |
| `server/store.ts` | The only database code. Admin SDK when the service account is set, client SDK otherwise. Export auth. |
| `netlify/functions/api.ts` | The shared router behind `serverless-http`. |
| `netlify/functions/export-subscribers.mts` | Scheduled function, `0 16 1,15 * *` UTC. |
| `server.ts` | Local development: the same router plus Vite. With `NODE_ENV=production` after a build, it serves `dist/` with the same rewrites and headers as Netlify, stub page included. |

## Data

Firestore holds one collection, `subscribers/{email}` with `email`, `subscribedAt`, `source`. `firestore.rules` denies everything else. There is no readings collection, and the signature scheme needs none.

## Build

`npm run build`:

1. `scripts/fetch-fonts.mjs` pulls Shapiro from the private font repo when `FONTS_TOKEN` is set. Without it, each Shapiro face falls back to Barlow through its own `@font-face` source list.
2. `vite build`: the standalone page into `dist/`.
3. `vite build --config vite.embed.config.ts`: `dist/embed/emoujia.js` and `dist/embed/emoujia.css`, fixed names.
4. `scripts/postbuild.mjs`: writes `dist/_redirects` (the emoujia.com redirect when switched on; the stub page's rewrites outside production) and copies `stub/` in outside production.

`scripts/flags.mjs` decides whether the three-emoji reading is built in. `netlify.toml` routes `/api/*` to the function with the two per-visitor caps, gives `/embed/*` a five-minute cache, and sets the stub page's policy.

## Tools

- `scripts/model-test.ts`: scores every Gemini model the key can use on real screenshots (OPERATIONS.md).
- `stub/`: the host page that imitates the studio site, for deploy previews.
