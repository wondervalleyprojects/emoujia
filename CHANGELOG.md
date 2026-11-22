# Changelog

## 0.3.0, 20 Nov 2026: ready to live inside the studio site (deploy preview; not live)

- **The embed.** The whole experience is one script and one stylesheet at fixed addresses (`/embed/emoujia.js`, `/embed/emoujia.css`, five-minute cache), mounted into one element the host gives, inside a shadow root. No header, footer, masthead, light switch or title of its own. It reads where its API lives from the element. It takes the host's Public Wonder tokens, type and light. emoujia.com is now a host page for the same embed. Contract: `docs/INTEGRATION.md`.
- **Site token names.** Font families and token names follow the studio site (V5), which won every difference. The list is in DESIGN.md.
- **Crop before sending.** The screenshot can be cropped to the keyboard in the browser; only the cropped part is sent.
- **The three-emoji reading** for people who cannot bring a screenshot: `POST /api/read-three`, one plain field, three emoji from the person's own keyboard. The server refuses anything else before the model is called. Shorter, and says so. Built into deploy previews only until its voice and notice are approved.
- **One place for the prompts and the routes.** `server/prompts.ts` (the grid prompt moved unchanged) and `server/api.ts`, shared by both servers.
- **The casing line names the model Google says answered**, not the one asked for. Google retires gemini-2.5-flash on 1 Dec 2026.
- **Signed readings.** The email route sends only readings this server made, unchanged, in the last 24 hours, and takes the essence from the signed text. The card must be a small JPEG. Nothing is stored.
- **Per-visitor caps** at Netlify's edge: 10 requests a minute, 3 emails in 3 minutes. A new "One at a time" message when they are hit.
- **Errors say what happened**: every route answers `{ error, code }`. A spent allowance is now a 429 `resting` for both readings, not a guessed-at 500.
- **The emoujia.com redirect**, prepared and off (`EMOUJIA_COM_REDIRECT`, OPERATIONS.md).
- **Subscribe label** proposed: "Tell me about new labs. It comes from Japhy Grant's Substack, a few times a year, along with his other writing." Same Firestore and CSV path as before.
- **How-to steps promise iPhone only** until an Android keyboard is tested.
- **Security:** the Gemini key is no longer wired into the browser build config; SMTP no longer skips certificate checks; the dev server logs paths, never bodies.
- **Removed:** Tailwind (only its reset was used), the old single-page App.
- **Tools:** `scripts/model-test.ts` (scores Gemini models on real screenshots), `stub/` (a host page imitating the studio site, deploy previews only).
- **Docs:** INTEGRATION (new), ARCHITECTURE, DESIGN, OPERATIONS, PRIVACY. PRIVACY now says the studio's Gmail keeps a copy of every emailed reading in Sent Mail.
- **21 Nov, prompts:** both prompts now forbid em and en dashes and ask that a flag, or any emoji for a real country, people, faith or place, be read with respect. The fallback prompt asks the oracle to admit in its own words that three emoji show less than a keyboard, after two models echoed the instruction back. The two added lines are PROPOSED wording.
- **21 Nov, either company:** `server/readings.ts` sends a model named `claude-*` to Anthropic and anything else to Google, from one list, `READING_MODELS`. After the test (Sonnet 5.5: 93% of emoji right in about 10 seconds; Gemini 3.6 Flash: 94% in 20 to 34), Japhy chose `claude-sonnet-5-5` alone, with no Google fallback, and that is the default. It needs `ANTHROPIC_API_KEY` in Netlify. When the prepaid credit or spending limit is used up, the page says the oracle is resting. Notices PROPOSED from that choice. Spending cap steps in OPERATIONS. `scripts/model-test.ts` tests Claude Haiku, Sonnet and Opus too when there is a key. New dependency: `@anthropic-ai/sdk`.
- **21 Nov 2026, before the preview:** Anthropic's per-minute limit now shows "One at a time", not the resting message (new code `busy`). `READING_SECRET` is required and never derived. The screenshot notice says Anthropic may look at what is sent, for safety, for up to 30 days, and links its retention page. Share card line: "Read by a machine. The studio keeps no readings." (also emoujia.com's masthead and description, which still said "kept by no one"). The model company's raw error text no longer reaches the browser. The three-emoji reading is on in every build, and the how-to sends everyone without an iPhone to it. EMJ-001's training exception closed (draft Register note in `docs/`). Decision record: `docs/adr/ADR-001.md`.
- **Open:** Android. No Android keyboard has been tested, so the how-to promises iPhone only.
- **Waiting on Japhy:** the fallback prompt's voice and three sample readings; the model list; free or paid tier, then both notices; the share card line that replaces "KEPT BY NO ONE"; the proposed lines marked PROPOSED in the code.

## 0.2.0, 1 Nov 2026: the Lab look

- Public Wonder, Lab face: Ink and white grounds, Auto, Day and Night light, tokens by their canonical names.
- Type: Shapiro (fetched at build from the private wvp-brand-fonts repo, never committed), Barlow standing in until then, DM Mono for the machine's words and the Record line.
- New first screen: "What do your emojis say about you?", the `[READ MY EMOJI]` invitation bracket, drop anywhere, how it works, what we keep.
- The wait is a machine log that adds lines and never loops.
- The reading: the trace band drawn from your grid, masthead strip, labels in the margin, the casing line naming the model, the Record line.
- Share card redrawn on a canvas as comp E. `html2canvas`, `motion` and `lucide-react` removed; the app's script went from about 500 KB to 212 KB.
- The resting message when the free Gemini allowance runs out.
- The reading email is plain, per the studio's email rules.
- Docs: About, Privacy, Design, Architecture, Operations.

## 0.1.0, 1 Nov 2026: keep nothing (PR #1)

- Readings are no longer stored. The opt-in starts unchecked.
- The subscriber export is closed behind a secret and runs on a schedule.
- The master bug replaces a redrawn one. "A Wonder Valley Projects Lab" replaces "a companion lab project."
- Disclosure under the upload button that Google's Gemini may use the screenshot to improve its models. Logged exception, EMJ-001.
- Replies to the reading email reach a person at emoujia@wondervalleyprojects.com.
