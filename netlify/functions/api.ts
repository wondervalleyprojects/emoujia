import express from 'express';
import serverless from 'serverless-http';
import nodemailer from 'nodemailer';
import { stringify } from 'csv-stringify/sync';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, addDoc, doc, setDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

dotenv.config();

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
};

const clientApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

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
    const model = "gemini-3.5-flash";
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

    const result = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }]
    });
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
    try {
      // 1. Store/Update Subscriber if opted in with 2 second timeout
      if (optIn) {
        console.log("[DB] Attempting to store subscriber...");
        await withTimeout(
          setDoc(doc(db, 'subscribers', email.toLowerCase()), {
            email: email.toLowerCase(),
            subscribedAt: serverTimestamp(),
            source: 'reading_form'
          }, { merge: true }),
          2000,
          "Firestore subscriber save"
        );
        console.log("[DB] Subscriber stored successfully.");
      }

      // 2. Store Reading with 2 second timeout
      console.log("[DB] Attempting to store reading...");
      await withTimeout(
        addDoc(collection(db, 'readings'), {
          email: email.toLowerCase(),
          readingText,
          essence,
          createdAt: serverTimestamp(),
          optIn: !!optIn
        }),
        2000,
        "Firestore reading save"
      );
      console.log("[DB] Reading stored successfully.");
    } catch (dbError: any) {
      console.warn("[DB Warning] Failed or timed out writing to Firestore database. Proceeding to send email anyway. Error:", dbError.message || dbError);
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

    const appUrl = process.env.VITE_APP_URL || 'https://emoujia.app';

    const mailOptions: any = {
      from: `"Emoujia Oracle" <${gmailUser}>`,
      replyTo: gmailUser,
      to: email,
      subject: "Your Emoujia Reading",
      text: `The Oracle has spoken.\n\n${emailBodyText}\n\n"${essence}"\n\nVisit your oracle again: ${appUrl}`,
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
            <p style="font-size: 11px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 20px;">
              <a href="${appUrl}" style="color: #666; text-decoration: none; font-weight: bold;">VISIT THE PORTAL</a>
            </p>
            <div style="margin-bottom: 12px;">
              <a href="https://www.wondervalleyprojects.com" style="text-decoration: none; display: inline-block;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #112E7B; text-align: center; font-family: sans-serif; font-size: 5px; font-weight: bold; display: inline-flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; padding: 2px;">
                  <span style="color: #FF3E6C; display: block; margin-bottom: 0px; line-height: 1;">WONDER</span>
                  <span style="color: #E9737E; display: block; margin-bottom: 0px; line-height: 1;">VALLEY</span>
                  <span style="color: #F9B277; display: block; line-height: 1;">PROJECTS</span>
                </div>
              </a>
            </div>
            <p style="font-size: 11px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">
              <a href="https://www.wondervalleyprojects.com" style="color: #666; text-decoration: underline;">a companion lab project</a>
            </p>
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

// Admin: Export Subscribers CSV
router.get(['/admin/export-subscribers', '/api/admin/export-subscribers'], async (req, res) => {
  try {
    const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'));
    const snapshot = await getDocs(q);
    const subscribers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        email: data.email,
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString?.() || '',
        source: data.source || ''
      };
    });

    const csv = stringify(subscribers, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=emoujia_subscribers.csv');
    res.send(csv);
  } catch (error: any) {
    console.error("Error exporting subscribers:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mount the router with prefixes to guarantee safe Netlify route matching
app.use('/api', router);
app.use('/.netlify/functions/api', router);
app.use('/', router);

export const handler = serverless(app);
