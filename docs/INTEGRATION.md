# Integration: Emoujia inside wondervalleyprojects.com

The contract between the Emoujia Netlify project and the studio site. The site's developer builds from this file alone. If this file and the code disagree, the code is wrong; fix one of them in the same change.

Status: 0.3.0, 20 Nov 2026. Built and checked locally against a stub host page. Not live.

## How it fits

The studio site is static (ADR-001) and serves `/lab/emoujia/`. Emoujia stays its own Netlify project, with its own functions. The site reaches it by **rewrite** (Netlify status 200 proxy), so to a visitor's browser every Emoujia address is on wondervalleyprojects.com. That is why the site's policy (`connect-src 'self'`, `script-src 'self'`) needs no change, and why Emoujia sends **no cross-origin headers**: nobody else needs to reach it.

```
visitor ── wondervalleyprojects.com/lab/emoujia/            (site's own page, site's own words)
             ├─ /lab/emoujia/embed.js    ─rewrite→  EMOUJIA/embed/emoujia.js
             ├─ /lab/emoujia/embed.css   ─rewrite→  EMOUJIA/embed/emoujia.css
             └─ /lab/emoujia/api/*       ─rewrite→  EMOUJIA/api/*   → function → Gemini, Gmail, Firestore
```

`EMOUJIA` is the Emoujia project's own Netlify address, [EMOUJIA NETLIFY ADDRESS, e.g. https://emoujia.netlify.app]. **Never rewrite to emoujia.com**: when the emoujia.com redirect is switched on (OPERATIONS.md), emoujia.com answers every request with a redirect to the site, and the rewrites would loop.

## Addresses the Emoujia project serves

| Address | What | Cache |
| --- | --- | --- |
| `/embed/emoujia.js` | The whole experience, one classic script (IIFE, no modules, no other files). About 230 KB, 73 KB gzipped. | `public, max-age=300` |
| `/embed/emoujia.css` | Its stylesheet, loaded inside the mount's shadow root. About 11 KB, 3 KB gzipped. | `public, max-age=300` |
| `POST /api/analyze` | The screenshot reading. | none |
| `POST /api/read-three` | The fallback reading, three typed emoji. | none |
| `POST /api/send-reading` | Emails a reading this server made. | none |
| `GET /api/admin/export-subscribers` | Studio only, behind a secret. The site never calls it. | none |

The names never change and carry no hash. A change reaches the site within five minutes of an Emoujia deploy.

## What the site needs

### 1. Rewrites (site's `netlify.toml` or `public/_redirects`)

```
/lab/emoujia/embed.js     EMOUJIA/embed/emoujia.js     200
/lab/emoujia/embed.css    EMOUJIA/embed/emoujia.css    200
/lab/emoujia/api/*        EMOUJIA/api/:splat           200
```

In `netlify.toml` form, with the per-visitor cap the site should carry on its side too (see Limits, "Whose address is counted"):

```toml
[[redirects]]
  from = "/lab/emoujia/embed.js"
  to = "EMOUJIA/embed/emoujia.js"
  status = 200
  force = true

[[redirects]]
  from = "/lab/emoujia/embed.css"
  to = "EMOUJIA/embed/emoujia.css"
  status = 200
  force = true

[[redirects]]
  from = "/lab/emoujia/api/*"
  to = "EMOUJIA/api/:splat"
  status = 200
  force = true
  [redirects.rate_limit]
    window_limit = 10
    window_size = 60
    aggregate_by = ["ip", "domain"]
```

### 2. The mount, on `/lab/emoujia/`

```html
<div data-emoujia
     data-api="/lab/emoujia/api"
     data-css="/lab/emoujia/embed.css"
     data-build-href="/lab/..."
     data-build-label="Build with the Lab"></div>
<script src="/lab/emoujia/embed.js" defer></script>
```

| Attribute | Required | What it does |
| --- | --- | --- |
| `data-emoujia` | yes | Marks the element. The script mounts every such element once. |
| `data-api` | yes | Base path of the API, no trailing slash needed. The embed calls `{data-api}/analyze`, `{data-api}/read-three`, `{data-api}/send-reading`. No address is written in the code. |
| `data-css` | yes | Address of the embed's stylesheet. |
| `data-build-href` | no | If given, a plain link at the foot of a finished reading. |
| `data-build-label` | no | Its words. Defaults to "Build with the Lab". |

Without `data-api` or `data-css` the embed draws nothing and logs one error to the console.

### 3. What the host supplies

The embed has **no header, footer, masthead, light switch or page title of its own**. The page supplies:

- **The heading and the page's own words.** With scripts off, the mount stays empty and these stand alone. The embed adds no noscript block.
- **Public Wonder tokens**, by the site's names, on `:root` or any ancestor of the mount. The embed reads: `--pw-role-ground`, `--pw-role-text`, `--pw-role-muted`, `--pw-role-accent`, `--pw-role-rule`, `--pw-role-focus`, `--pw-font-display`, `--pw-font-label`, `--pw-font-text`, `--pw-font-mono`, `--pw-type-body`, `--pw-type-body-lh`, `--pw-type-label`, `--pw-type-label-tracking`, `--pw-tap-min`, `--pw-space-1`, `--pw-space-2`, `--pw-space-4`, `--pw-rule-thin`, `--pw-motion-snap`, `--pw-motion-tactile`, `--pw-motion-plot`, `--pw-motion-pen`, `--pw-motion-ease`, `--pw-sheet-arrow-nudge`, `--pw-sheet-bracket-open`, `--pw-sheet-bracket-underline`, `--pw-record-web`, `--pw-record-web-min`, `--pw-color-ink`, `--pw-color-white`, `--pw-color-signal`. Every one has a fallback, so a missing token degrades rather than breaks.
- **The light.** The embed follows whatever the tokens say. Day and night switch with the site's own `data-theme` and `data-light`, nothing else.
- **The fonts**, as `@font-face` on the page: "Shapiro", "Shapiro Wide", "Shapiro Text" (weight 400) and "DM Mono" (400 and 500). Fonts declared on the page are used inside the shadow root, and by the share card's canvas.

### 4. The site's own build check

`scripts/check.mjs` step 4 fails any `src="/..."` that is not a file in `dist/`. `/lab/emoujia/embed.js` is served by rewrite, not from `dist/`, so the check will fail on it. Allow that one address (and `/lab/emoujia/embed.css` if it ever appears in a `href`) by name.

Step 7 fails a page with a `<form>`. The embed's email form is drawn by the script inside the shadow root, so it is not in the built HTML and the check does not see it. That is the point of the check, not a way round it: the site's own pages still carry no forms.

## Isolation

- Everything renders inside the mount's **shadow root** (open). The stylesheet is a `<link>` inside it.
- **Nothing leaks out.** No selector in `emoujia.css` can match anything outside the mount.
- **The host's styles do not reach in.** Selectors from the page do not cross a shadow boundary. Inherited properties do (font, color, letter-spacing, text-transform), and a host rule on the mount element itself beats the embed's `:host` rule, so the reset is on the embed's own root: `.emoujia { all: initial }`. `all` does not reset custom properties, so tokens still arrive.
- **Checked** on the stub host page (`/stub/lab/emoujia/` on deploy previews) with hostile host rules (`div { font-family: "Comic Sans MS" !important; color: lime; letter-spacing: .2em }`, `button { background: hotpink }`, yellow backgrounds on the embed's own class names): none showed inside; the mount element itself took Comic Sans, as expected, and nothing inherited it.
- **Policy.** The embed uses no inline script, no inline `<style>`, no `style=""` attributes in markup, no `eval`, and loads nothing from another host. The few positions it sets at run time (the crop box) go through the style object, which a policy does not block. The screenshot is shown as a `data:` image, never `blob:`. The stub page runs it under `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'` with **zero violations**. The site's own policy is looser than that, so it passes there too.

## The routes

All take and answer JSON. Every error answers `{ "error": "<plain sentence>", "code": "<code>" }`.

| Code | Status | Meaning |
| --- | --- | --- |
| `invalid_input` | 400 | The request is not what the route takes. Nothing was sent to the model. |
| `too_large` | 413 | The body is over the route's limit. |
| `unsigned` | 403 | `/send-reading` only: the reading was not made by this server, was changed, or is over 24 hours old. |
| `resting` | 429 | Google's free allowance is spent. It comes back on its own (midnight Pacific). |
| (none) | 429 | Netlify's per-visitor cap. Netlify answers before the function runs; the body is not JSON. |
| `oracle_error` | 502 | The model failed, or answered in a shape we could not read. |
| `send_failed` | 502 | The email did not go out. |
| `not_found` | 404 | No such route. |

### `POST /api/analyze`

Request, at most 4 MB:

```json
{ "image": "data:image/jpeg;base64,..." }
```

JPEG, PNG or WebP as a data URL, at most 3 MB decoded. The embed sends a JPEG, cropped by the visitor and shrunk to 1024 px on its long side (typically 60 to 300 KB).

Answer, 200:

```json
{
  "kind": "grid",
  "emojis": ["😂", "🥲", "🔥"],
  "reading": "THE RULING SIGN\n...\n\nTHE SHADOW\n...\n\nTHE READING\n...\n\nYOUR FORECAST\n...\n\nTHE ESSENCE\n...",
  "model": "gemini-2.5-flash",
  "issuedAt": 1795230219199,
  "signature": "base64url"
}
```

`model` is the name Google gives in its answer, not the one requested. `emojis` may be empty when no grid was found; the embed then asks for a screenshot of the keyboard.

### `POST /api/read-three`

Request, at most 1 KB, exactly this shape and nothing else:

```json
{ "emojis": ["🔥", "❤️", "🐈‍⬛"] }
```

Refused with `invalid_input` before any model call: fewer or more than three; any item that is not exactly one emoji (text, digits, a script tag, two emoji in one item, emoji with text); repeats [CONFIRM: refuse repeats]; any other field; an empty or non-JSON body. An emoji typed without its emoji selector (a bare ❤) is read as the emoji (❤️).

Answer, 200: as `/analyze`, with `"kind": "three"`, the three emoji as checked, and a reading with four sections (THE RULING SIGN, THE READING, YOUR FORECAST, THE ESSENCE).

### `POST /api/send-reading`

Request, at most 1 MB:

```json
{
  "email": "person@example.com",
  "optIn": false,
  "kind": "grid",
  "emojis": ["..."],
  "reading": "...",
  "issuedAt": 1795230219199,
  "signature": "...",
  "card": "data:image/jpeg;base64,..."
}
```

`kind`, `emojis`, `reading`, `issuedAt` and `signature` are returned exactly as the reading route gave them. The server checks the signature (an HMAC over all four) and refuses anything changed, unsigned or over 24 hours old with `unsigned`. The essence in the email is taken from the signed text, not from the browser. `card` is optional and must be a JPEG under 600 KB. `optIn: true` keeps the address (PRIVACY.md); anything else does not.

Answer, 200: `{ "success": true, "fallback": false }`. `fallback: true` means the email went without the card.

## Limits

| Limit | Value | Where |
| --- | --- | --- |
| Requests per visitor, all routes but email | 10 per 60 seconds, then 429 | Emoujia's `netlify.toml` |
| Requests per visitor, `/send-reading` | 3 per 180 seconds, then 429 | Emoujia's `netlify.toml` |
| Body, `/analyze` | 4 MB | `server/api.ts` |
| Image, decoded | 3 MB | `server/readings.ts` |
| Body, `/read-three` | 1 KB | `server/api.ts` |
| Body, `/send-reading` | 1 MB; card 600 KB | `server/api.ts` |
| Signature lifetime | 24 hours | `server/sign.ts` |
| Time to a reading | [MEASURED ON THE DEPLOY PREVIEW] | |
| Function time limit | Netlify's for synchronous functions; [CONFIRM ON THE PREVIEW] | Netlify |

**Whose address is counted.** Netlify counts per visitor address at its edge, and stores nothing the studio can see. Netlify's documentation does not say which address it counts when a request arrives through another Netlify site's rewrite; it may be the site's, which would put every visitor in one bucket. So the site should carry the same cap on its own `/lab/emoujia/api/*` rewrite, where the visitor's address is certain. The free plan allows two rules per project.

## Testing it

- On any Emoujia deploy preview, `/stub/lab/emoujia/` is a host page with the site's tokens and light rules copied in, a stricter policy than the site's, hostile global styles and the same rewrites as above. In the console, `emoujiaProbe()` reports the tokens and fonts the embed actually received.
- Locally: `npm run build`, then `NODE_ENV=production npm run dev` and open `http://localhost:3000/stub/lab/emoujia/`.
- The stub never ships to production (`scripts/postbuild.mjs`).

## Copy the site carries that this changes

These lines live in the site and in JaphyOS, not here. Nothing was changed there. They promise "tap three", which this build does not do; the screenshot is the reading and typing three is the fallback:

- `src/pages/lab/emoujia.astro`: the description "Try one: tap three emoji and get a reading in under a minute."; `data-proposed="emoujia-line"` "Emoujia. Tap three. A reading in under a minute."; the twelve-slot drawing with three taps; `[EMOUJIA NOTICE: EMJ-001 PENDING]`; the button to `EMOUJIA_URL` (it becomes the mount).
- Studio Introduction Copy v6, the Lab card: "Try one: tap three emoji and get a reading in under a minute." (v6's own note: "The line holds only while that's true.")
- Public Wonder V5, 12.6 (signed as a design): "Emoujia. Tap three. A reading in under a minute."
- `src/config/site.ts`: `EMOUJIA_URL` and `LEAVES.emoujia` ("opens emoujia.com") stop applying once the reading is on the site.
