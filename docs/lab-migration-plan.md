# Emoujia in the Wonder Valley Projects Lab

Working plan for moving Emoujia into Public Wonder as a Lab. Status: DRAFT until Japhy signs it.

## Decisions so far (1 Nov 2026)

- Emoujia is a Wonder Valley Projects Lab. "Companion Lab" is retired.
- Readings are sent by email if asked, then not kept. Nothing about a reading is stored.
- The one thing kept: the email address of someone who checks "Subscribe for more information." The box starts unchecked.
- The subscriber export is closed behind `EXPORT_SECRET` and runs as a scheduled job that emails the CSV for the Substack import.
- The bug is the master file (LOGO-001), never redrawn.
- The page reads without JavaScript; the reading itself needs it.
- Register: code EMJ approved; the site is EMJ-001.
- Gemini's free tier stays the engine, as a logged exception (EMJ-001 Notes, 1 Nov 2026, allowed by JG, review 1 May 2027): its terms let Google use inputs to improve its models, which departs from the rule that participant material is never offered for training. Disclosed under the upload button: "Your screenshot is read by Google's Gemini, which may use it to improve its models. We keep nothing." Traffic is far below the Shapiro webfont license (10,000 pageviews a month).
- Reading email signs off: "Sent by a machine for the Wonder Valley Projects Lab. Reviewed by a person: no. Replies reach a person." Replies go to emoujia@wondervalleyprojects.com, which reaches Japhy (tested 1 Nov 2026).
- Share card (comp E, `docs/comps/share-card-E-final.png`): "Wonder Valley Projects Lab" and the labels in Shapiro Wide, the Essence in Shapiro Heavy, everything else in DM Mono.
- The site's Lab face, night by default: Ink ground, white text, Signal for thin lines and accents. The emoji are the only color.

## Phases

1. Make it true: stop storing readings, uncheck opt-in, lock the export, real bug, no-JS page, README. (Done, merged 1 Nov 2026, PR #1.)
2. Lab skin: tokens, Shapiro and DM Mono, Ink and white grounds, no cards or glows, labels in the margin, Record line, casing line, V4 motion. (Done, 0.2.0.)
3. The fun layer: the per-grid triad band, the log-style wait, the new share card, the resting message when the free tier runs out. (Done, 0.2.0.)
4. Integration: `/lab/emoujia` on the new site by rewrite, canonical URL and JSON-LD, a Lab Note, the Register row.

## For Japhy to do in consoles

- Fonts: a private repo with the three Shapiro files and a read-only token in Netlify (`FONTS_REPO`, `FONTS_TOKEN`). Steps in `docs/OPERATIONS.md`.

- Firebase: delete the existing `readings` collection, publish the new `firestore.rules`, create a service account key and put its `client_email` and `private_key` into Netlify as `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.
- Netlify: set `EXPORT_SECRET` (and `EXPORT_TO` if the CSV should go somewhere other than `GMAIL_USER`).
