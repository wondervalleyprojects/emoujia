# EMOUJIA

An oracle for your frequently used emoji.

The app reads your iPhone's frequently used emoji grid the way a palmist reads a hand. Upload a screenshot. Get a reading. Atmospheric, psychologically acute, slightly unnerving.

A Wonder Valley Projects Lab. Read by a machine, kept by no one: readings are never stored. The only thing Emoujia keeps is the email address of someone who checks "Subscribe for more information."

Live at [emoujia.com](https://emoujia.com).

## How it works
EMOUJIA uses **Google Gemini Flash** (vision; `gemini-2.5-flash`, falling back to `gemini-3.5-flash`) to analyze a screenshot of a user's emoji keyboard. The process is optimized using a single-pass extraction and generation logic:
1.  **Vision Analysis**: Detects and extracts exact emojis from the 30-grid "Frequently Used" section.
2.  **Oracle Interpretation**: Synthesizes the extracted emojis into a multi-section reading:
    -   **THE RULING SIGN**: An analysis of the primary emoji.
    -   **THE SHADOW**: An overlooked pattern within the grid.
    -   **THE READING**: A deep synthesis of the full emotional architecture.
    -   **YOUR FORECAST**: A one-sentence direction.
    -   **THE ESSENCE**: A short, atmospheric summation.

## Features
-   **Combined Extraction & Generation**: High-speed processing using Gemini Flash.
-   **Shareable Omens**: Generate a visual card of your reading to share on social media.
-   **Preserve the Omens**: Email yourself the reading and share card. The reading is sent, then not kept.
-   **Subscribe for more information**: An unchecked box. Only people who check it are kept on the list.
-   **Scheduled export**: A Netlify scheduled function (`netlify/functions/export-subscribers.mts`) emails the subscriber CSV on the 1st and 15th for the Substack import.

## Getting started
1.  Clone the repo: `git clone https://github.com/wondervalleyprojects/emoujia.git`
2.  `npm install`
3.  Copy `.env.example` to `.env` and configure:
    -   `GEMINI_API_KEY`: Get one at [AI Studio](https://aistudio.google.com/app/apikey).
    -   `GMAIL_USER`: Your primary Gmail address.
    -   `GMAIL_APP_PASSWORD`: A 16-character Google App Password.
4.  `npm run dev`

## Deployment (Netlify)
This project is configured for one-click deployment to Netlify.

1.  Connect your GitHub repository to Netlify.
2.  Set the following **Environment Variables** in the Netlify UI (Site settings > Build & deploy > Environment):
    -   `GEMINI_API_KEY`: Your Google AI Studio key.
    -   `GMAIL_USER`: Your Gmail address.
    -   `GMAIL_APP_PASSWORD`: Your 16-character App Password.
    -   `VITE_APP_URL`: Your final Netlify URL (e.g., `https://emoujia.netlify.app`).
    -   `FIREBASE_PROJECT_ID`: From your Firebase project settings.
    -   `FIREBASE_APP_ID`: From your Firebase project settings.
    -   `FIREBASE_API_KEY`: From your Firebase project settings.
    -   `FIREBASE_AUTH_DOMAIN`: From your Firebase project settings.
    -   `FIREBASE_DATABASE_ID`: From your Firebase project settings.
    -   `FIREBASE_STORAGE_BUCKET`: From your Firebase project settings.
    -   `FIREBASE_MESSAGING_SENDER_ID`: From your Firebase project settings.
    -   `FIREBASE_SERVICE_ACCOUNT`: A Firebase service account key (JSON, raw or base64). Required for the subscriber export.
    -   `EXPORT_SECRET`: A long random string. Opens `/api/admin/export-subscribers` to requests that send `Authorization: Bearer <EXPORT_SECRET>`. Unset, the endpoint answers 404.
    -   `EXPORT_TO`: Optional. Where the scheduled CSV goes; defaults to `GMAIL_USER`.

### Handling Netlify Secrets Scanner
Netlify's automated scanner may flag Firebase public keys as secrets. If your build is blocked despite removing hardcoded secrets, add this environment variable to Netlify:
- `SECRETS_SCAN_OMIT_KEYS`: `FIREBASE_,VITE_`

3.  The `netlify.toml` file automatically configures the build and API routes.

### Subscriber export
`netlify/functions/export-subscribers.mts` runs on a schedule (`0 16 1,15 * *`, UTC) and emails the CSV. To pull it by hand:

```
curl -H "Authorization: Bearer $EXPORT_SECRET" https://emoujia.com/api/admin/export-subscribers
```

or run `npx tsx scripts/export_subscribers.ts` with the env vars set.

### Firestore rules
`firestore.rules` denies everything except creating a well-formed subscriber record. Readings are never written. Once `FIREBASE_SERVICE_ACCOUNT` is set, the subscriber block can be removed too.

## Tech Stack
-   **Frontend**: React 19, Vite, Tailwind CSS, Motion.
-   **Serverless Backend**: Netlify Functions (Express via `serverless-http`).
-   **AI**: Google Gemini Flash via `@google/genai`.
-   **Database**: Firestore, for opted-in subscribers only.
-   **Email**: Nodemailer with Gmail SMTP.
-   **Utilities**: `html2canvas` for image generation, `csv-stringify` for exports.

## License
MIT

## Made by
A [Wonder Valley Projects](https://wondervalleyprojects.com) Lab
