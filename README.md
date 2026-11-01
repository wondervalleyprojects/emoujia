# Emoujia

What do your emojis say about you?

Emoujia reads the Frequently Used section of your emoji keyboard the way a palmist reads a hand. Upload a screenshot. Get a reading. Atmospheric, psychologically acute, slightly unnerving.

A Wonder Valley Projects Lab, live at [emoujia.com](https://emoujia.com). Read by a machine, kept by no one.

## The idea

Emoujia comes from a simple question: how could someone's personal data work for them, and be pleasurable and fun? Your phone quietly ranks the emoji you use most. Emoujia hands that ranking back to you as a reading, and then lets go of it. More in [docs/ABOUT.md](docs/ABOUT.md).

## How it works

1. You screenshot the Frequently Used section of your emoji keyboard and bring it to the page.
2. The browser shrinks it and sends it to Google's Gemini (`gemini-2.5-flash`, falling back to `gemini-3.5-flash`), which lists the emoji and writes a reading in five parts:
   - **The ruling sign**: the first emoji.
   - **The shadow**: a pattern you overlooked.
   - **The reading**: the whole grid.
   - **Your forecast**: one sentence.
   - **The essence**: one line for a spectator.
3. The page shows the reading, a trace drawn from your grid, and a share card drawn in your browser.
4. You can download the card or email yourself the reading. Nothing about it is stored.

## What we keep

Nothing about the reading. The only thing kept is the email address of someone who checks "Subscribe for more information," which starts unchecked. The screenshot goes to Google's Gemini on the free tier, whose terms let Google use it to improve its models; the page says so under the upload button. That is a logged exception to the studio's rules, kept so the Lab stays free to run. Full account: [docs/PRIVACY.md](docs/PRIVACY.md).

## Run it locally

```
npm install
cp .env.example .env   # add GEMINI_API_KEY at least
npm run dev            # http://localhost:3000
```

For Shapiro locally, put the three `.woff2` files in `public/fonts/shapiro/` (never commit them). Without them Barlow stands in.

## Deploy

Netlify builds `main` for the `emoujia` project. `npm run build` fetches Shapiro from the private wvp-brand-fonts repo when `FONTS_TOKEN` is set, then runs Vite. Every setting, key and console step is in [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Docs

| | |
| --- | --- |
| [About](docs/ABOUT.md) | The idea and the terms. |
| [Privacy](docs/PRIVACY.md) | Exactly where every piece of data goes. |
| [Design](docs/DESIGN.md) | Public Wonder in the Lab face: type, color, the trace, the share card, motion. |
| [Architecture](docs/ARCHITECTURE.md) | Files, endpoints, data, build. |
| [Operations](docs/OPERATIONS.md) | Environment variables, fonts, the export, removal requests, troubleshooting. |
| [Changelog](CHANGELOG.md) | What changed and when. |
| [Lab migration plan](docs/lab-migration-plan.md) | Decisions and phases for joining the Lab. |

## Stack

React 19 and Vite; Netlify Functions (Express via `serverless-http`); Google Gemini via `@google/genai`; Firestore for opted-in subscribers only; Nodemailer with Gmail. Type: Shapiro (licensed, fetched at build), Barlow and DM Mono (open licenses, in `public/fonts/`).

## License

Code: MIT. The Wonder Valley Projects mark (`public/wvp-bug.svg`) and the Shapiro typeface are not covered by the MIT license.

---

A [Wonder Valley Projects](https://wondervalleyprojects.com) Lab.

`RECORD · LAB · EMJ-001 · 01 NOV 2026 · JG + MACHINE ASSIST · PUBLISHED`
