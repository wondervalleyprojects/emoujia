# EMOUJIA

An oracle for your frequently used emoji.

The app reads your iPhone's frequently used emoji grid the way a palmist reads a hand. Upload a screenshot. Get a reading. Atmospheric, psychologically acute, slightly unnerving.

## Demo
[Live demo](https://emoujia.app)

## How it works
EMOUJIA uses Google Gemini 1.5 Flash (vision) to analyze the provided screenshot and identify the emojis in the grid. It then uses the same model to generate a four-section reading based on the patterns and symbols detected, reflecting the user's subconscious choices and presenting a themed "oracle" interpretation.

## Getting started
1.  Clone the repo: `git clone https://github.com/wondervalleyprojects/emoujia.git`
2.  `npm install`
3.  Copy `.env.example` to `.env` and add your Gemini API key (free at https://aistudio.google.com/app/apikey)
4.  `npm run dev`

## Deployment
This project is configured for deployment on Netlify.
1.  Push your code to GitHub.
2.  Connect the repository to Netlify.
3.  Set the `GEMINI_API_KEY` and `VITE_APP_URL` environment variables in the Netlify dashboard.
4.  Deploy.

## Tech stack
-   **React + Vite** (TypeScript)
-   **Tailwind CSS** for styling
-   **Google Gemini Flash** via `@google/genai` SDK
-   **html2canvas** for the shareable image card
-   **Motion** for animations

## License
MIT

## Made by
[Wonder Valley Projects](https://wondervalleyprojects.com)
