import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function generateFullReading(base64Image: string): Promise<{ emojis: string[], reading: string }> {
  const model = "gemini-3-flash-preview"; 
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

  if (!apiKey) {
    throw new Error("Oracle connection failed: missing key.");
  }

  try {
    const mimeType = base64Image.split(";")[0].split(":")[1] || "image/png";
    const data = base64Image.split(",")[1] || base64Image;

    const imagePart = {
      inlineData: { mimeType, data },
    };

    console.log("Calling Gemini for combined extraction and reading...");
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    const text = response.text || "{}";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").replace(/```\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    if (!result.emojis || !result.reading) {
      throw new Error("The oracle returned an incomplete sequence.");
    }

    return result;
  } catch (e) {
    console.error("Combined reading failed", e);
    throw e;
  }
}
