import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GOOGLE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function readEmojisFromImage(base64Image: string): Promise<string[]> {
  const model = "gemini-2.0-flash"; // Latest requested model
  const prompt = `You are a hyper-precise emoji analyst. The user has uploaded a screenshot of their iPhone emoji keyboard's "Frequently Used" section. 

Your task is to identify every single emoji with 100% accuracy, paying extreme attention to subtle variants. 
DO NOT simplify. If it is a Phoenix, do not say Peacock. If it is a Smiling Face with Tear, do not say Crying Face.

Identification Checklist:
- Phoenix (Bird of fire): 🐦‍🔥 (Not 🦚)
- Backhand Index Pointing Up: 👆 (Not ☝️)
- Smiling Face with Tear: 🥲 (Not 😢 or 😭)
- Face with Spiral Eyes: 😵‍💫 (Not 😵 or 😶‍🌫️)
- Expanding Heart: 💗 (Not ✨💖 or 💓)
- Face in Clouds: 😶‍🌫️ (Not 💨)
- Distinguish between all heart types (sparkling, beating, growing, etc.)

Order: left to right, top to bottom.
Return ONLY a valid JSON array of emoji characters. No markdown, no commentary.
Example: ["🔥", "🧊", "🫠", "🐈‍⬛"]`;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from environment");
    throw new Error("Oracle connection failed: missing key.");
  }

  try {
    const mimeType = base64Image.split(";")[0].split(":")[1] || "image/png";
    const data = base64Image.split(",")[1] || base64Image;

    const imagePart = {
      inlineData: {
        mimeType,
        data,
      },
    };

    console.log("Calling Gemini for emoji extraction...");
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    const text = response.text || "[]";
    console.log("Raw response from Gemini:", text);

    // Clean potential markdown if the model ignored the "no markdown" instruction
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").replace(/```\n?|\n?```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to read emojis from image", e);
    throw e;
  }
}

export async function generateReading(emojis: string[]): Promise<string> {
  const model = "gemini-2.0-flash";
  const emojiStr = emojis.join(", ");
  const prompt = `You are EMOUJIA — an oracle that reads emoji the way a palmist reads a hand or a Ouija board reads a room. You have been given a person's frequently used emoji: the symbols they reached for, over and over, in private and public conversations. They did not consciously choose these. They accumulated.

Existing Emojis to read: ${emojiStr}

Your reading has five sections. Write each with a plain ALL-CAPS header (no markdown), then a line break, then the body.

Tone: straight face, dry edge. Matter-of-fact about strange things. Not ironic. Not mystical-performative. Address the user directly as "you". Like a tarot reader who has done ten thousand readings and is no longer surprised by anything. Use the actual emoji characters as anchors in the text. Be specific. Be a little uncomfortable. Don't explain — state.

---

THE RULING SIGN
One tight paragraph. The first emoji in the grid is the ruling sign. What does it reveal about how YOU present yourself — and what that presentation costs you? Be specific to this emoji. Use "You" and "Your".

THE SHADOW
One paragraph. One emoji from the grid that reveals something YOU likely haven't consciously tracked — a pattern, an avoidance, a contradiction you're not quite aware of.

THE READING
Three to four paragraphs. Synthesize the full grid into a portrait: your emotional register, relational patterns, what you're reaching for, what you're suppressing. Use specific emoji as evidence. Acute. Kind but not reassuring. Use "You".

YOUR FORECAST
One sentence only. Not a prediction — a direction. Something you can carry.

THE ESSENCE
One sentence only. A sharp, definitive summation of who YOU are, according to the grid. Written for a spectator.

---

Write nothing outside these five sections. No preamble. No sign-off. No "I hope this reading resonates."`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || "";
}
