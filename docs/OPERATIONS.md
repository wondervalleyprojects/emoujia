# Operations

Everything that lives outside the code: settings, keys, fonts, the export, and what to do when something breaks.

## Where it runs

- **Netlify project `emoujia`** serves emoujia.com and builds from `main`. Pull requests get deploy previews. From 0.3.0 it also serves the embed and the API that wondervalleyprojects.com/lab/emoujia/ reaches by rewrite ([Integration](INTEGRATION.md)).
- **Firebase** holds the subscriber list.
- **Gmail** sends the reading emails from the account in `GMAIL_USER`. Replies go to emoujia@wondervalleyprojects.com.
- **Google AI Studio** issues the Gemini key (free tier).

Another Netlify project outside the studio's team also builds this repo (it shows up as `effulgent-kitten-f03c05` on pull requests). Most likely it was created when the app was first deployed from Google AI Studio. It does not serve emoujia.com and changes nothing; disconnect it from the GitHub repo settings (Integrations) if it is ever in the way.

## Environment variables (Netlify, project `emoujia`)

| Name | Scope | What it is |
| --- | --- | --- |
| `GEMINI_API_KEY` | Functions | Google AI Studio key. No longer used for readings (Claude only from 21 Nov 2026). It can be removed from Netlify once `ANTHROPIC_API_KEY` or `READING_SECRET` is set; kept locally for the model test. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Functions | The sending account and its 16-character app password. |
| `VITE_APP_URL` | Builds, Functions | `https://emoujia.com` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_DATABASE_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID` | Functions | Firebase project settings. |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Functions | From a service account key. Needed for the export. Not set yet. |
| `EXPORT_SECRET` | Functions | Opens the manual export. Not set yet. |
| `EXPORT_TO` | Functions | Optional. Where the CSV goes; defaults to `GMAIL_USER`. |
| `REPLY_TO` | Functions | Optional. Defaults to emoujia@wondervalleyprojects.com. |
| `READING_SECRET` | Functions | **Required.** Signs each reading so the email route sends only readings this server made. A long random string (32 characters or more); it is never derived from another key. Without it no reading can be made: the page says the oracle is silent and the function log says `READING_SECRET is not set`. Changing it voids readings already on screen (they can no longer be emailed). |
| `READING_MODELS` | Functions | Optional. Comma-separated models to try in order. A name starting `claude-` goes to Anthropic; anything else goes to Google. The two can be mixed. Defaults to `claude-sonnet-5-5` alone (Japhy, 21 Nov 2026, from the model test), so no reading goes to Google. The older name `GEMINI_MODELS` is still read. |
| `ANTHROPIC_API_KEY` | Functions | **Not set yet.** An Anthropic Console key. Until it is set, no reading can be made and the page says the oracle is silent. Anthropic has no free tier: about 1.4 cents a screenshot reading and 0.7 cents a three-emoji reading on Sonnet 5.5, measured 21 Nov 2026. Set a spending limit first (below). |
| `CLAUDE_EFFORT` | Functions | Optional. `low` (default), `medium` or `high`: how long a Claude model thinks before it answers. Thinking is charged as output. Medium read no better than low in the test. |
| `EMOUJIA_COM_REDIRECT` | Builds | Off unless set. `302` or `301` sends emoujia.com to the studio site. See below. |
| `EMOUJIA_FALLBACK` | Builds | Optional. `off` leaves the three-emoji reading out of a build. Unset: on everywhere (from 21 Nov 2026: the how-to sends everyone without an iPhone to it). |
| `FONTS_TOKEN` | Builds | Read-only token for wvp-brand-fonts. Not set yet. See Fonts. |
| `SECRETS_SCAN_OMIT_KEYS` | Builds | `FIREBASE_,VITE_` if Netlify's secret scanner flags the public Firebase config. |

Netlify functions share a 4KB limit for all their variables together, which is why the service account goes in as two fields, not the whole key file.

## Fonts

Shapiro is licensed to Wonder Valley Projects LLC (MyFonts webfont license, 2018, up to 10,000 pageviews a month across the studio's sites). This repo is public, so the font files must never be committed; `public/fonts/shapiro/` is in `.gitignore`. Serving them from the live site is what the license allows. Publishing them in a public repo is not.

At build time `scripts/fetch-fonts.mjs` copies three files from the studio's private repo [wondervalleyprojects/wvp-brand-fonts](https://github.com/wondervalleyprojects/wvp-brand-fonts): `webFonts/Shapiro75Heavy`, `webFonts/Shapiro75HeavyWide` and `webFonts/Shapiro45WelterText` (each `font.woff2`). Until the token is set, Barlow stands in and the site works.

One-time setup (about five minutes). The same token can serve the main site and Watershed later:

1. On GitHub: your avatar, Settings, Developer settings, Personal access tokens, **Fine-grained tokens**, Generate new token.
2. Resource owner: wondervalleyprojects. Repository access: **Only select repositories**, `wvp-brand-fonts`. Permissions: **Contents, Read-only**. Nothing else. Set an expiry and a calendar reminder to renew it.
3. In Netlify, project `emoujia`, Site configuration, Environment variables: add `FONTS_TOKEN` with the token, scope **Builds**, marked secret. (`FONTS_REPO` is optional; it defaults to the brand fonts repo.)
4. Trigger a deploy. The build log says `[fonts] Fetched 3 of 3 Shapiro files from wondervalleyprojects/wvp-brand-fonts.`

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
| "The oracle is resting" (Claude) | Claude's prepaid credit or monthly spending limit is used up | Netlify, Logs, Functions, `api`: the `[oracle]` line says which. Buy credit in the Anthropic Console, or wait for the 1st if it was the monthly limit. |
| "One at a time" straight after choosing a screenshot | Anthropic's per-minute rate limit, or Netlify's per-visitor cap | Wait a minute. If it keeps happening with few visitors, the shared workspace's rate limit is being used by other work: see "Capping what Claude can cost". |
| "The oracle is silent" | Gemini error, bad key, or a network problem | Netlify, Logs, Functions, `api`. Lines start `[oracle]` with the model and the company's message. Check `GEMINI_API_KEY` (and `ANTHROPIC_API_KEY` if a Claude model is listed). |
| "One at a time" | A visitor passed the per-visitor cap | Nothing; it clears within a minute. If real visitors hit it, raise `window_limit` in `netlify.toml`. |
| "This reading can no longer be emailed" | The reading is over 24 hours old, or `READING_SECRET` or the Gemini key changed since it was made | Nothing; read again. |
| "The oracle couldn't find a grid" | The screenshot is not of the emoji keyboard | Nothing; the page explains. |
| Email never arrives | Gmail app password revoked, or the account's sending limit | Netlify function logs show the SMTP error. Make a new app password. |
| Export email missing | Service account not set | See Subscriber export. |
| Headlines look like Barlow | Fonts not fetched | Check `FONTS_REPO`, `FONTS_TOKEN` and the build log. |

## Launch day

In this order, on the day the new wondervalleyprojects.com reaches production:

1. Before production: move Emoujia to its own Anthropic workspace with its own monthly spend limit, make a new key there, swap it into Netlify, and delete the old key. Confirm the resting message appears when that workspace's limit is reached. (Steps under "Capping what Claude can cost".)
2. Check `READING_SECRET` is set in Netlify (scope Functions).
3. Turn on the emoujia.com redirect (next section).

## The emoujia.com redirect

Prepared, **off**. Japhy turns it on the day the new wondervalleyprojects.com reaches production.

What it does: every request to emoujia.com or www.emoujia.com goes to `https://wondervalleyprojects.com/lab/emoujia/`. The project's own netlify.app address is not matched, so it keeps serving the embed and the API to the studio site's rewrites. `scripts/postbuild.mjs` writes the rules into `dist/_redirects` at build time, only when the variable is set.

**Turn it on**

1. Check first: the studio site is live, `/lab/emoujia/` shows the reading, and its rewrites point at the netlify.app address, not at emoujia.com (INTEGRATION.md). Otherwise the site's reading breaks the moment this goes on.
2. Netlify, project `emoujia`, Site configuration, Environment variables, Add a variable: `EMOUJIA_COM_REDIRECT`, value `302`, scope **Builds**, all deploy contexts. (302 first: browsers do not keep it, so turning it off works at once.)
3. Change `VITE_APP_URL` to `https://wondervalleyprojects.com/lab/emoujia/` (scope Builds and Functions). It is the "Read another" link in the reading email.
4. Deploys, Trigger deploy, Deploy site. The build log says `[postbuild] emoujia.com redirect ON (302)`.
5. Check, in a private window and in Terminal:
   - `curl -sI https://emoujia.com/ | grep -i -E "^(HTTP|location)"` shows `302` and the studio address.
   - `curl -sI https://www.emoujia.com/anything | grep -i location` shows the same.
   - `curl -sI [EMOUJIA NETLIFY ADDRESS]/embed/emoujia.js | head -1` shows `200`.
   - A reading on wondervalleyprojects.com/lab/emoujia/ still works.
6. After a week with nothing wrong, change the value to `301` and deploy again. Browsers keep a 301: from then on, turning it off reaches only people who have not been sent it before.

**Turn it off**

1. Delete `EMOUJIA_COM_REDIRECT` (or set it to `off`), and set `VITE_APP_URL` back to `https://emoujia.com`.
2. Trigger a deploy. The log says `[postbuild] emoujia.com redirect off.`
3. `curl -sI https://emoujia.com/ | head -1` shows `200`.

Or, for an emergency, Deploys, pick the last deploy before the change, **Publish deploy**.

**Also on that day, decided separately:** the share card still says EMOUJIA.COM [YOUR CALL]. The footer links on emoujia.com stop being seen.

## Per-visitor caps

`netlify.toml` caps requests per visitor address at Netlify's edge: 3 emails in 3 minutes, and 10 requests a minute to everything else under `/api/`. Over that, Netlify answers 429 itself and the function never runs; the page says "One at a time" or, for email, asks the visitor to wait. The studio stores nothing about anyone for this. The free plan allows two such rules per project; both are used. Netlify's own rate-limit page: https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/

## Capping what Claude can cost

From Anthropic's own pages, read 21 Nov 2026 ([rate limits](https://platform.claude.com/docs/en/api/rate-limits), [paying for the API](https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-api-usage)). Japhy does these; nothing here is automated. Budget: $10 every three months. At about 1.4 cents a screenshot reading, that is about 700 readings.

**Now, for the deploy preview.** The preview uses an existing key in Japhy's default Anthropic workspace. That workspace has a $25 monthly limit, shared with other things. So the cap on Emoujia is not its own yet: other work can use the limit up and put the oracle to rest, and Emoujia can use up what the other work needs. Fine for a preview that few people see. Not fine for production.

**Before production** (also in the launch-day list below): move Emoujia to its own Anthropic workspace with its own monthly spend limit, make a new key there, swap it into Netlify, and delete the old key. Confirm the resting message appears when that workspace's limit is reached.

How, as far as Anthropic's pages say:

1. Console, Workspaces: create a workspace for Emoujia. [CONFIRM THE MENU NAMES IN THE CONSOLE]
2. In that workspace, set a monthly spend limit. The organization-wide one is at Spend limits (`platform.claude.com/settings/spend-limits`), "Monthly spend limit", "Set limit"; a workspace has its own under the workspace's limits. [CONFIRM IN THE CONSOLE] To hold to $10 a quarter, about $3 a month.
3. Create an API key in that workspace. In Netlify, project `emoujia`, replace the value of `ANTHROPIC_API_KEY` (scope Functions) and deploy.
4. Delete the old key in the Console.
5. Test the limit: set the workspace limit to its lowest value, or below what the workspace has already spent this month, ask for one reading, and see "The oracle is resting". Then set the limit back. The function log line starts `[oracle] claude-sonnet-5-5 failed:` and carries Anthropic's message.

Also true: the API runs on prepaid credit (Console, Billing, "Buy credits"). With auto-reload off, the credit bought is the most the whole account can spend. Credit expires a year after it is bought.

What the visitor sees:

| What happened at Anthropic | The page says |
| --- | --- |
| The spend limit is reached, or the credit is gone | "The oracle is resting" |
| Too many requests this minute (a rate limit) | "One at a time": wait a minute |
| Overloaded, a bad key, anything else | "The oracle is silent" |

The first row was tested on 21 Nov 2026 against faked replies, using the message Anthropic's rate-limits page gives for a reached limit. The message for used-up credit and for a workspace limit is assumed to read alike. Step 5 is the real test.

## Testing the model choice

`scripts/model-test.ts` runs the grid prompt on real screenshots with every model the key can use and scores the emoji each one read. Put screenshots and an `expected.json` in `model-test/` (ignored by git), set `GEMINI_API_KEY` in `.env`, then `npx tsx scripts/model-test.ts`. With `ANTHROPIC_API_KEY` in `.env` as well, it also runs Claude Haiku, Sonnet and Opus. `ONLY=model,model` narrows the list; `THREE=` followed by three emoji also measures the fallback reading. The calls go to Google or Anthropic under that key's terms, and the Anthropic ones cost money. Each run overwrites `model-test/results.json`.

## Shipping changes

Work on a branch, open a pull request, check the Netlify deploy preview on a phone, then merge. Anything people submit to (the email form) is a Critical change under Public Wonder: keyboard and screen reader pass, a phone at 375px and text at 200%, reduced motion, consent wording read by a second person, and a line in the changelog.
