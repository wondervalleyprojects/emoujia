import express from 'express';
import serverless from 'serverless-http';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { buildReadingEmail } from '../../server/readingEmail';
import { saveSubscriber, subscribersCsv, exportAuthorized } from '../../server/store';

dotenv.config();


const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// API Routes with Multi-Path Router for Netlify Serverless Compatibility
const router = express.Router();

// Gemini Analysis Route
router.post(['/analyze', '/api/analyze'], async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Image data is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Oracle connection failed: missing server key.' });

  try {
    const prompt = `You are EMOUJIA — an oracle that reads emoji the way a palmist reads a hand. 
  
The user has provided a screenshot of their emoji keyboard's "Frequently Used" section.

FIRST: Extract every single emoji from the image with 100% accuracy.
Identification Checklist:
- Phoenix (Bird of fire): 🐦‍🔥 (Not 🦚)
- Backhand Index Pointing Up: 👆 (Not ☝️)
- Smiling Face with Tear: 🥲 (Not 😢 or 😭)
- Face with Spiral Eyes: 😵‍💫 (Not 😵 or 😶‍🌫️)
- Expanding Heart: 💗 (Not ✨💖 or 💓)
- Face in Clouds: 😶‍🌫️ (Not 💨)
Order: left to right, top to bottom.

SECOND: Generate a reading based on these emojis.
Your reading has five sections. Write each with a plain ALL-CAPS header (no markdown), then a line break, then the body.

Tone: straight face, dry edge. Matter-of-fact about strange things. Address the user directly as "you". Sprinkle relevant emojis liberally throughout the text of the reading to maintain the oracle's visual language.

Sections:
1. THE RULING SIGN: One tight paragraph on the first emoji.
2. THE SHADOW: One paragraph on an overlooked pattern from the grid.
3. THE READING: Three to four paragraphs synthesizing the full grid.
4. YOUR FORECAST: One sentence direction.
5. THE ESSENCE: One short phrase summation for a spectator. Do NOT use "You are".

OUTPUT FORMAT:
Return a JSON object with two keys:
"emojis": string[] (the list of extracted emojis)
"reading": string (the full reading text following the headers above)

Example Output:
{
  "emojis": ["🔥", "🫠", "🐈‍⬛"],
  "reading": "THE RULING SIGN\\n...\\n\\nTHE SHADOW\\n...\\n\\nTHE READING\\n...\\n\\nYOUR FORECAST\\n...\\n\\nTHE ESSENCE\\n..."
}

Return ONLY valid JSON. No markdown. No commentary.`;

    const mimeType = image.includes(";") ? (image.split(";")[0].split(":")[1] || "image/png") : "image/png";
    const rawData = image.includes(",") ? image.split(",")[1] : image;
    
    // Clean base64 string of any standard trailing padding errors, newlines, or URL-safe encoding differences
    let cleanData = rawData.trim().replace(/[\r\n]/g, '').replace(/ /g, '+');
    // Align/pad to multiple of 4
    const pad = cleanData.length % 4;
    if (pad > 0) {
      cleanData += '='.repeat(4 - pad);
    }

    const imagePart = {
      inlineData: { mimeType, data: cleanData },
    };

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash"];
    let lastError: any = null;
    let result: any = null;
    let usedModel = '';

    for (const selectedModel of modelsToTry) {
      try {
        console.log(`Attempting Netlify analysis with model: ${selectedModel}`);
        result = await ai.models.generateContent({
          model: selectedModel,
          contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }]
        });
        usedModel = selectedModel;
        console.log(`Successfully generated content using model: ${selectedModel}`);
        break;
      } catch (error: any) {
        console.error(`Error with model ${selectedModel}:`, error);
        lastError = error;
      }
    }

    if (!result) {
      throw lastError || new Error("All oracle connection attempts failed due to model load.");
    }

    const text = result.text || "{}";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").replace(/```\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.emojis || !parsed.reading) {
      throw new Error("The oracle returned an incomplete sequence.");
    }

    res.json({ ...parsed, model: usedModel });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Send Reading Email
router.post(['/send-reading', '/api/send-reading'], async (req, res) => {
  const { email, readingText, essence, shareCardImage, optIn } = req.body;

  if (!email || !readingText) {
    return res.status(400).json({ error: 'Email and reading text are required' });
  }

  // Helper function to handle async calls with a timeout
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs))
    ]);
  };

  try {
    // Readings are never stored. The email address is kept only when the person
    // checked "Subscribe for more information."
    if (optIn) {
      try {
        await withTimeout(saveSubscriber(email), 2000, 'Subscriber save');
      } catch (dbError: any) {
        console.warn('[DB Warning] Subscriber save failed. Sending the email anyway.', dbError?.message || dbError);
      }
    }

    // 3. Send Email
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return res.json({ success: true, warning: 'Email configuration missing on server.' });
    }

    const emailBodyText = readingText
      .split(/THE ESSENCE/i)[0]
      .replace(/^[ \t]+/gm, '')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();

    const appUrl = process.env.VITE_APP_URL || 'https://emoujia.com';

    const mailOptions: any = {
      from: `"Emoujia, a Wonder Valley Projects Lab" <${gmailUser}>`,
      replyTo: process.env.REPLY_TO || 'emoujia@wondervalleyprojects.com',
      to: email,
      ...buildReadingEmail(emailBodyText, essence || '', appUrl),
    };

    // SMTP transporter fallback configurations
    const transporters = [
      {
        name: "Gmail Service Agent (Recommended)",
        config: {
          service: 'gmail',
          auth: { user: gmailUser, pass: gmailPass },
          connectionTimeout: 4000,
          socketTimeout: 6000
        }
      },
      {
        name: "Direct SMTPS (Port 465, IPv4)",
        config: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          family: 4, // Force IPv4 to bypass any IPv6 connection stalls
          auth: { user: gmailUser, pass: gmailPass },
          connectionTimeout: 4000,
          socketTimeout: 5000,
          tls: { rejectUnauthorized: false }
        }
      },
      {
        name: "Direct STARTTLS (Port 587, IPv4)",
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          family: 4, // Force IPv4
          auth: { user: gmailUser, pass: gmailPass },
          connectionTimeout: 4000,
          socketTimeout: 5000,
          tls: { rejectUnauthorized: false }
        }
      }
    ];

    let emailSent = false;
    let fallbackUsed = false;
    let lastError: any = null;

    // Phase 1: Try with attachment on each transporter config
    for (const tConfig of transporters) {
      if (emailSent) break;
      console.log(`[SMTP] Attempting connection via ${tConfig.name} with attachment...`);
      try {
        const transporter = nodemailer.createTransport(tConfig.config as any);
        const activeMailOptions = { ...mailOptions };
        if (shareCardImage) {
          // Clean base64 string of any spaces or formatting issues
          const base64Data = shareCardImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, "").trim().replace(/[\r\n]/g, '').replace(/ /g, '+');
          activeMailOptions.attachments = [{
            filename: 'emoujia-share-card.jpg',
            content: base64Data,
            encoding: 'base64'
          }];
        }

        await transporter.sendMail(activeMailOptions);
        console.log(`[SMTP] Success via ${tConfig.name} with attachment.`);
        emailSent = true;
      } catch (err: any) {
        console.warn(`[SMTP] Failed via ${tConfig.name} with attachment:`, err.message || err);
        lastError = err;
      }
    }

    // Phase 2: If failed with attachment, try sending WITHOUT attachment to minimize payload size and bypass network limits
    if (!emailSent && shareCardImage) {
      console.log(`[SMTP] Retrying SMTP transport configurations WITHOUT attachment...`);
      for (const tConfig of transporters) {
        if (emailSent) break;
        console.log(`[SMTP Fallback] Attempting connection via ${tConfig.name} without attachment...`);
        try {
          const transporter = nodemailer.createTransport(tConfig.config as any);
          const activeMailOptions = { ...mailOptions };
          activeMailOptions.attachments = [];
          activeMailOptions.text += "\n\n(Note: The card image attachment was omitted to secure delivery over slow connections.)";
          if (activeMailOptions.html) {
            activeMailOptions.html = activeMailOptions.html.replace(
              `<p style="text-align: center; font-style: italic; opacity: 0.6; font-size: 14px;">The Oracle has spoken.</p>`,
              `<p style="text-align: center; font-style: italic; opacity: 0.6; font-size: 14px;">The Oracle has spoken.</p><p style="text-align: center; font-size: 11px; color: #888; font-style: italic; margin-top: 4px;">(Transmitted in text-only mode for fast delivery)</p>`
            );
          }

          await transporter.sendMail(activeMailOptions);
          console.log(`[SMTP] Success via ${tConfig.name} without attachment input.`);
          emailSent = true;
          fallbackUsed = true;
        } catch (err: any) {
          console.warn(`[SMTP Fallback] Failed via ${tConfig.name} without attachment:`, err.message || err);
          lastError = err;
        }
      }
    }

    if (!emailSent) {
      throw lastError || new Error("All SMTP channels and fallback attempts failed.");
    }

    res.json({ success: true, fallback: fallbackUsed });
  } catch (error: any) {
    console.error("Error in /api/send-reading:", error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Admin: subscriber CSV. Closed unless EXPORT_SECRET is set; then it needs
// "Authorization: Bearer <EXPORT_SECRET>". The scheduled email lives in
// netlify/functions/export-subscribers.mts.
router.get(['/admin/export-subscribers', '/api/admin/export-subscribers'], async (req, res) => {
  if (!exportAuthorized(req.get('authorization'))) {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const { csv } = await subscribersCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=emoujia_subscribers.csv');
    res.send(csv);
  } catch (error: any) {
    console.error("Error exporting subscribers:", error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Mount the router with prefixes to guarantee safe Netlify route matching
app.use('/api', router);
app.use('/.netlify/functions/api', router);
app.use('/', router);

export const handler = serverless(app);
