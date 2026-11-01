import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { saveSubscriber, subscribersCsv, exportAuthorized } from './server/store';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // API Routes
  
  // Gemini Analysis Route
  app.post('/api/analyze', async (req, res) => {
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

      for (const selectedModel of modelsToTry) {
        try {
          console.log(`Attempting analysis with model: ${selectedModel}`);
          result = await ai.models.generateContent({
            model: selectedModel,
            contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }]
          });
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

      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send Reading Email
  app.post('/api/send-reading', async (req, res) => {
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
        console.warn("Gmail credentials not set, skipping email send.");
        return res.json({ success: true, warning: 'Email configuration missing on server.' });
      }

      // Clean up reading text for email (remove essence and fix indentation)
      const emailBodyText = readingText
        .split(/THE ESSENCE/i)[0] // Remove the Essence section from the main text block
        .replace(/^[ \t]+/gm, '') // Remove potential leading spaces/indentation
        .split('\n')
        .map(line => line.trim()) // Ensure every line is trimmed
        .join('\n')
        .trim();

      const appUrl = process.env.VITE_APP_URL || 'https://emoujia.app';

      const mailOptions: any = {
        from: `"Emoujia, a Wonder Valley Projects Lab" <${gmailUser}>`,
        replyTo: process.env.REPLY_TO || 'emoujia@wondervalleyprojects.com',
        to: email,
        subject: "Your Emoujia Reading",
        text: `The Oracle has spoken.\n\n${emailBodyText}\n\n"${essence}"\n\nVisit your oracle again: ${appUrl}\n\nYour reading was sent and not kept.\n\n--\nSent by a machine for the Wonder Valley Projects Lab. Reviewed by a person: no. Replies reach a person.`,
        html: `
          <div style="font-family: serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; padding: 20px;">
            <h1 style="text-align: center; letter-spacing: 0.3em; font-weight: normal; margin-bottom: 10px;">EMOUJIA</h1>
            <p style="text-align: center; font-style: italic; opacity: 0.6; font-size: 14px;">The Oracle has spoken.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <div style="font-size: 16px; line-height: 1.8; color: #333; text-align: left;">
              ${emailBodyText.replace(/\n/g, '<br/>')}
            </div>
            
            <div style="margin-top: 50px; text-align: center; background: #f4f4f4; padding: 40px 20px; border-radius: 12px; border: 1px solid #eee;">
               <p style="font-size: 10px; font-family: sans-serif; text-transform: uppercase; tracking: 0.2em; margin-bottom: 15px; opacity: 0.5;">The Essence</p>
               <h2 style="font-size: 26px; font-style: italic; margin: 0; font-weight: normal; color: #1a1a1a; line-height: 1.3;">"${essence}"</h2>
            </div>
            
            <div style="margin-top: 60px; text-align: center; border-top: 1px solid #eee; padding-top: 30px;">
              <p style="font-size: 11px; font-family: sans-serif; margin-bottom: 8px;">
                <a href="${appUrl}" style="color: #1a1a1a; text-decoration: none; font-weight: bold; letter-spacing: 0.05em;">Visit the portal</a>
              </p>
              <p style="font-size: 11px; font-family: sans-serif; margin: 0;">
                <a href="https://www.wondervalleyprojects.com" style="color: #888; text-decoration: none; letter-spacing: 0.05em;">A Wonder Valley Projects Lab</a>
              </p>
            <p style="font-size: 11px; font-family: sans-serif; margin-top: 16px; color: #555;">Your reading was sent and not kept.<br/>Sent by a machine for the Wonder Valley Projects Lab. Reviewed by a person: no. Replies reach a person.</p>
            </div>
          </div>
        `
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
  app.get('/api/admin/export-subscribers', async (req, res) => {
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

  // Catch-all for API routes that don't exist
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);

  });
}

startServer();
