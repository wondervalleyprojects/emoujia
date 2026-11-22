// Splits a string of emoji into graphemes, so 🐈‍⬛ stays one slot.
export function splitEmoji(list: string[]): string[] {
  const seg = new Intl.Segmenter();
  return list.flatMap((e) => [...seg.segment(e)].map((s) => s.segment)).filter((e) => e.trim());
}

// The Emoujia pattern: slots joined in triads. Each slot sits on one of four
// steps, chosen from its emoji, so every grid draws its own trace.
export function traceSteps(emojis: string[]): number[] {
  return emojis.map((e) => [...e].reduce((a, ch) => a + (ch.codePointAt(0) || 0), 0) * 7 % 4);
}

export function formatDate(d = new Date()): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/\./g, '');
}

export interface ReadingSection { header: string; content: string }
export function parseReading(reading: string): ReadingSection[] {
  const parts = reading.split(/(THE RULING SIGN|THE SHADOW|THE READING|YOUR FORECAST|THE ESSENCE)/g);
  const out: ReadingSection[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const content = parts[i + 1]?.trim().replace(/^[ \t]+/gm, '').replace(/\n?---\s*$/, '').trim();
    if (content) out.push({ header: parts[i], content });
  }
  return out;
}
