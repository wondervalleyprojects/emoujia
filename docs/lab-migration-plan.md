# Emoujia in the Wonder Valley Projects Lab

Working plan for moving Emoujia into Public Wonder as a Lab. Status: DRAFT until Japhy signs it.

## Decisions so far (1 Nov 2026)

- Emoujia is a Wonder Valley Projects Lab. "Companion Lab" is retired.
- Readings are sent by email if asked, then not kept. Nothing about a reading is stored.
- The one thing kept: the email address of someone who checks "Subscribe for more information." The box starts unchecked.
- The subscriber export is closed behind `EXPORT_SECRET` and runs as a scheduled job that emails the CSV for the Substack import.
- The bug is the master file (LOGO-001), never redrawn.
- The page reads without JavaScript; the reading itself needs it.
- Gemini's free tier stays the engine. Traffic is far below the Shapiro webfont license (10,000 pageviews a month).
- The site's Lab face, night by default: Ink ground, white text, Signal for thin lines and accents. The emoji are the only color.

## Open

- Share card typeface: A (Shapiro), B (DM Mono) or C (hybrid). Comps in `docs/comps/`.
- Email signature for the reading email. Proposed: "Sent by a machine for the Wonder Valley Projects Lab. Reviewed by a person: no." Add "Replies reach a person." only if someone reads the inbox.
- Register code for Emoujia. Proposed: EMJ.
- Free tier honesty: the screenshot goes to Google's Gemini. On the free tier Google's terms let it use inputs to improve its products. Decide whether "kept by no one" needs a qualifier, or whether to move to the paid tier, which does not use inputs that way.

## Phases

1. Make it true: stop storing readings, uncheck opt-in, lock the export, real bug, no-JS page, README. (Done on this branch.)
2. Lab skin: tokens, Shapiro and DM Mono, Ink and white grounds, no cards or glows, labels in the margin, Record line, casing line, V4 motion.
3. The fun layer: the per-grid triad band, the log-style wait, the new share card, the resting message when the free tier runs out.
4. Integration: `/lab/emoujia` on the new site by rewrite, canonical URL and JSON-LD, a Lab Note, the Register row.

## For Japhy to do in consoles

- Firebase: delete the existing `readings` collection, publish the new `firestore.rules`, create a service account key and set `FIREBASE_SERVICE_ACCOUNT` in Netlify.
- Netlify: set `EXPORT_SECRET` (and `EXPORT_TO` if the CSV should go somewhere other than `GMAIL_USER`).
