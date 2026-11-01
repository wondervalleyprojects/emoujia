# Operations

Everything that lives outside the code: settings, keys, fonts, the export, and what to do when something breaks.

## Where it runs

- **Netlify project `emoujia`** serves emoujia.com and builds from `main`. Pull requests get deploy previews.
- **Firebase** holds the subscriber list.
- **Gmail** sends the reading emails from the account in `GMAIL_USER`. Replies go to emoujia@wondervalleyprojects.com.
- **Google AI Studio** issues the Gemini key (free tier).

Another Netlify account outside the studio's team also builds this repo (it shows up as `effulgent-kitten-f03c05` on pull requests). It does not serve emoujia.com. Find which account it is and disconnect it, or leave it; it changes nothing.

## Environment variables (Netlify, project `emoujia`)

| Name | Scope | What it is |
| --- | --- | --- |
| `GEMINI_API_KEY` | Functions | Google AI Studio key. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Functions | The sending account and its 16-character app password. |
| `VITE_APP_URL` | Builds, Functions | `https://emoujia.com` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_DATABASE_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID` | Functions | Firebase project settings. |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Functions | From a service account key. Needed for the export. Not set yet. |
| `EXPORT_SECRET` | Functions | Opens the manual export. Not set yet. |
| `EXPORT_TO` | Functions | Optional. Where the CSV goes; defaults to `GMAIL_USER`. |
| `REPLY_TO` | Functions | Optional. Defaults to emoujia@wondervalleyprojects.com. |
| `FONTS_REPO`, `FONTS_TOKEN`, `FONTS_DIR` | Builds | The private font repo. Not set yet. See Fonts. |
| `SECRETS_SCAN_OMIT_KEYS` | Builds | `FIREBASE_,VITE_` if Netlify's secret scanner flags the public Firebase config. |

Netlify functions share a 4KB limit for all their variables together, which is why the service account goes in as two fields, not the whole key file.

## Fonts

Shapiro is licensed to Wonder Valley Projects LLC (MyFonts webfont license, 2018, up to 10,000 pageviews a month across the studio's sites). This repo is public, so the font files must never be committed; `public/fonts/shapiro/` is in `.gitignore`. Serving them from the live site is what the license allows. Publishing them in a public repo is not.

At build time `scripts/fetch-fonts.mjs` copies them from a private GitHub repo. Until that is set up, Barlow stands in and the site works.

One-time setup (about ten minutes), reusable for every studio site:

1. On GitHub, create a **private** repo, for example `wondervalleyprojects/wvp-brand-fonts`.
2. Add a folder `shapiro/` with three files from the brand kit (Commons / Brand / 00. Public Wonder Brand Kit, the Shapiro folders), renamed:
   - `Shapiro75Heavy/font.woff2` → `shapiro/Shapiro75Heavy.woff2`
   - `Shapiro75HeavyWide/font.woff2` → `shapiro/Shapiro75HeavyWide.woff2`
   - `Shapiro45Welter/font.woff2` → `shapiro/Shapiro45Welter.woff2`
3. On GitHub, Settings, Developer settings, **Fine-grained tokens**, Generate new token: repository access "Only select repositories" with that repo; permission **Contents: Read-only**. Set an expiry and a calendar reminder to renew it.
4. In Netlify (project `emoujia`), add `FONTS_REPO` = `wondervalleyprojects/wvp-brand-fonts` and `FONTS_TOKEN` = the token, scope **Builds**, marked secret.
5. Trigger a deploy. The build log says `[fonts] Fetched 3 of 3 Shapiro files.`

## Subscriber export

- Scheduled: `netlify/functions/export-subscribers.mts` emails the CSV on the 1st and 15th at 16:00 UTC.
- By hand: `curl -H "Authorization: Bearer $EXPORT_SECRET" https://emoujia.com/api/admin/export-subscribers`
- Both need `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`. Without them the scheduled job logs an error and sends nothing.

To set up the service account: Firebase console, gear, Project settings, Service accounts, Generate new private key. Copy `client_email` and `private_key` (keep the `\n` characters) into the two Netlify variables, marked secret, scope Functions. Delete the downloaded file. Never paste the key anywhere else.

## Firebase housekeeping

- Publish `firestore.rules` (Firestore, Rules, paste, Publish). Check the database picker; Emoujia's database is the one in `FIREBASE_DATABASE_ID`.
- Delete the old `readings` collection from before 1 Nov 2026 (Firestore, Data, the collection's menu, Delete collection).
- Once the service account is set, the subscriber block in the rules can be removed too.

## Removal requests

The footer's "Remove me" opens an email to emoujia@wondervalleyprojects.com. Delete the address from Firestore (`subscribers/{email}`) and from Substack. Reply to say it is done. Keep no record of the request unless the person asks for one.

## When something breaks

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| "The oracle has read all it can for today" | Gemini free tier quota is spent | Nothing; it resets. If it happens often, consider a paid key (which also closes the training exception). |
| "The oracle is silent" | Gemini error, bad key, or a network problem | Netlify, Logs, Functions, `api`. Check `GEMINI_API_KEY`. |
| "The oracle couldn't find a grid" | The screenshot is not of the emoji keyboard | Nothing; the page explains. |
| Email never arrives | Gmail app password revoked, or the account's sending limit | Netlify function logs show the SMTP error. Make a new app password. |
| Export email missing | Service account not set | See Subscriber export. |
| Headlines look like Barlow | Fonts not fetched | Check `FONTS_REPO`, `FONTS_TOKEN` and the build log. |

## Shipping changes

Work on a branch, open a pull request, check the Netlify deploy preview on a phone, then merge. Anything people submit to (the email form) is a Critical change under Public Wonder: keyboard and screen reader pass, a phone at 375px and text at 200%, reduced motion, consent wording read by a second person, and a line in the changelog.
