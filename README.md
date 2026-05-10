# EMOUJIA

An oracle for your frequently used emoji.

The app reads your iPhone's frequently used emoji grid the way a palmist reads a hand. Upload a screenshot. Get a reading. Atmospheric, psychologically acute, slightly unnerving.

## Demo
[Live demo](https://ais-pre-eydhglqwgqizslzfccu43x-261071089900.us-east5.run.app)

## How it works
EMOUJIA uses **Google Gemini 1.5 Flash** (vision) to analyze a screenshot of a user's emoji keyboard. The process is optimized using a single-pass extraction and generation logic:
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
-   **Preserve the Omens**: Opt-in to receive your reading via email and join the Emoujia mailing list.
-   **Automated Exports**: A built-in system exports subscriber lists every bi-weekly for Substack integration.

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
2.  Set the following **Environment Variables** in the Netlify UI:
    -   `GEMINI_API_KEY`: Your Google AI Studio key.
    -   `GMAIL_USER`: Your Gmail address.
    -   `GMAIL_APP_PASSWORD`: Your 16-character App Password.
    -   `VITE_APP_URL`: Your final Netlify URL (e.g., `https://emoujia.netlify.app`).
3.  The `netlify.toml` file automatically configures the build and API routes.

### Handling Scheduled Exports
Netlify Functions have an execution limit. For bi-weekly subscriber exports, it is recommended to use **Netlify Scheduled Functions** (requires a Pro plan or custom cron triggers) or a separate GitHub Action that calls the `/api/admin/export-subscribers` endpoint.

## Tech Stack
-   **Frontend**: React 19, Vite, Tailwind CSS, Motion.
-   **Serverless Backend**: Netlify Functions (Express via `serverless-http`).
-   **AI**: Google Gemini 1.5 Flash via `@google/genai`.
-   **Database**: Firestore for readings and subscriber management.
-   **Email**: Nodemailer with Gmail SMTP.
-   **Utilities**: `html2canvas` for image generation, `csv-stringify` for exports.

## License
MIT

## Made by
[Wonder Valley Projects Lab](https://wondervalleyprojects.com)
