export interface ReadingResult { emojis: string[]; reading: string; model?: string }

export class RestingError extends Error {}

export async function generateFullReading(image: string): Promise<ReadingResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  if (!response.ok) {
    let message = `Status ${response.status}`;
    try { message = (await response.json()).error || message; } catch { /* not JSON */ }
    if (response.status === 429 || /quota|429|exhausted|rate/i.test(message)) throw new RestingError(message);
    throw new Error(message);
  }
  const result = await response.json();
  if (!result.emojis || !result.reading) throw new Error('The oracle returned an incomplete reading.');
  return result;
}
