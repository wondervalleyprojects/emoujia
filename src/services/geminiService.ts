export async function generateFullReading(base64Image: string): Promise<{ emojis: string[], reading: string }> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Oracle error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.emojis || !result.reading) {
      throw new Error("The oracle returned an incomplete sequence.");
    }

    return result;
  } catch (e) {
    console.error("Combined reading failed", e);
    throw e;
  }
}
