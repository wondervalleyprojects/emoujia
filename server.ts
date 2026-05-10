import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { stringify } from 'csv-stringify/sync';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { initializeApp as initializeClientApp } from 'firebase/app';

dotenv.config();
import { getFirestore as getClientFirestore, collection, addDoc, doc, setDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  projectId: 'gen-lang-client-0365094838',
  appId: '1:907908129152:web:26241f84d0c573d81ce165',
  apiKey: 'AIzaSyBe_EAD8EQiQX8R28CUGPC-d1ZcoshRd4Q',
  authDomain: 'gen-lang-client-0365094838.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-ba8645f8-a857-4aaf-afb0-8024a7560e64',
  storageBucket: 'gen-lang-client-0365094838.firebasestorage.app',
  messagingSenderId: '907908129152',
};

const clientApp = initializeClientApp(firebaseConfig);
const db = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

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
      const model = "gemini-1.5-flash"; // Using standard flash for production stability
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

      const mimeType = image.split(";")[0].split(":")[1] || "image/png";
      const data = image.split(",")[1] || image;

      const imagePart = {
        inlineData: { mimeType, data },
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
  app.post('/api/send-reading', async (req, res) => {
    const { email, readingText, essence, shareCardImage, optIn } = req.body;

    if (!email || !readingText) {
      return res.status(400).json({ error: 'Email and reading text are required' });
    }

    try {
      // 1. Store/Update Subscriber if opted in
      if (optIn) {
        await setDoc(doc(db, 'subscribers', email.toLowerCase()), {
          email: email.toLowerCase(),
          subscribedAt: serverTimestamp(),
          source: 'reading_form'
        }, { merge: true });
      }

      // 2. Store Reading
      await addDoc(collection(db, 'readings'), {
        email: email.toLowerCase(),
        readingText,
        essence,
        createdAt: serverTimestamp(),
        optIn: !!optIn
      });

      // 3. Send Email
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPass) {
        console.warn("Gmail credentials not set, skipping email send.");
        return res.json({ success: true, warning: 'Email configuration missing on server, but data was saved.' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });

      const senderEmail = 'emoujia@wondervalleyprojects.com'; // Use alias for 'from'
      
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
        from: { name: "Emoujia Oracle", address: senderEmail },
        replyTo: senderEmail,
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
              <p style="font-size: 11px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 12px;">
                <a href="${appUrl}" style="color: #666; text-decoration: none; font-weight: bold;">VISIT THE PORTAL</a>
              </p>
              <p style="font-size: 11px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.2em;">
                <a href="https://www.wondervalleyprojects.com" style="color: #666; text-decoration: underline;">A WONDER VALLEY PROJECTS LAB</a>
              </p>
            </div>
          </div>
        `
      };

      // Add attachment if provided
      if (shareCardImage) {
        const base64Data = shareCardImage.replace(/^data:image\/png;base64,/, "");
        mailOptions.attachments = [
          {
            filename: 'emoujia-share-card.png',
            content: base64Data,
            encoding: 'base64'
          }
        ];
      }

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error in /api/send-reading:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Export Subscribers CSV
  // Note: This is an unauthenticated export for demonstration. 
  // In real use, this should be password protected.
  app.get('/api/admin/export-subscribers', async (req, res) => {
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
    
    // Scheduled Task: Check every 24 hours if it's time to export subscribers
    // The user wants it "every other week". We'll check every day.
    setInterval(async () => {
      const now = new Date();
      // Simple check: Send on the 1st and 15th of the month
      if (now.getDate() === 1 || now.getDate() === 15) {
        console.log("Triggering scheduled subscriber export...");
        try {
          // We can call a internal function or use the logic from export_subscribers.ts
          // For simplicity within the same process:
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

          if (subscribers.length > 0) {
            const csv = stringify(subscribers, { header: true });
            const gmailUser = process.env.GMAIL_USER;
            const gmailPass = process.env.GMAIL_APP_PASSWORD;
            
            if (gmailUser && gmailPass) {
              const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } });
              const senderEmail = 'emoujia@wondervalleyprojects.com';
              await transporter.sendMail({
                from: { name: "Emoujia System", address: senderEmail },
                replyTo: senderEmail,
                to: 'japhy@wondervalleyprojects.com',
                subject: `Emoujia: Scheduled Subscriber Export (${now.toISOString().split('T')[0]})`,
                text: "Attached is the latest subscriber list for your Substack import.",
                attachments: [{ filename: `subscribers_${now.toISOString().split('T')[0]}.csv`, content: csv }]
              });
              console.log("Scheduled export sent to japhy@wondervalleyprojects.com");
            }
          }
        } catch (err) {
          console.error("Scheduled export failed:", err);
        }
      }
    }, 24 * 60 * 60 * 1000); // Once a day
  });
}

startServer();
