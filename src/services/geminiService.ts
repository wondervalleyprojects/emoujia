export async function generateFullReading(base64Image: string): Promise<{ emojis: string[], reading: string }> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      let errorMessage = `Oracle error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonErr) {
        try {
          const rawText = await response.text();
          errorMessage = rawText.substring(0, 150) || errorMessage;
        } catch {
          errorMessage = `HTTP Status ${response.status} (${response.statusText || 'Unknown Error'})`;
        }
      }
      throw new Error(errorMessage);
    }

    try {
      const result = await response.json();
      if (!result.emojis || !result.reading) {
        throw new Error("The oracle returned an incomplete sequence.");
      }
      return result;
    } catch (parseErr: any) {
      throw new Error(`Failed to read the oracle's response: ${parseErr?.message || parseErr}`);
    }
  } catch (e) {
    console.error("Combined reading failed", e);
    throw e;
  }
}
