import { VercelRequest, VercelResponse } from '@vercel/node';

interface GemmaResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function normalizeGemmaApiError(raw: string): string {
  if (raw.includes('PERMISSION_DENIED') || raw.includes('denied access')) {
    return 'PERMISSION_DENIED: This Google Cloud project/key does not have Gemma API access. Use a key from a project with Generative Language API + Gemma access enabled.';
  }

  if (raw.includes('API_KEY_INVALID')) {
    return 'API_KEY_INVALID: The configured GEMMA_API_KEY is invalid.';
  }

  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
    return 'RESOURCE_EXHAUSTED: Gemma quota/rate limit reached for this project.';
  }

  return raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const apiKey = process.env.GEMMA_API_KEY;
    const model = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
    const candidateModels = [model, 'gemma-4-31b-it', 'gemma-4-26b-a4b-it'].filter(
      (value, index, array) => array.indexOf(value) === index
    );

    if (!apiKey) {
      res.status(500).json({ error: 'GEMMA_API_KEY is not configured' });
      return;
    }

    const { prompt, expectsJson } = req.body as { prompt?: string; expectsJson?: boolean };
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    let lastStatus = 500;
    let lastErrorText = 'Unknown Gemma API error';

    for (const candidateModel of candidateModels) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 700,
              ...(expectsJson ? { responseMimeType: 'application/json' } : {})
            }
          })
        }
      );

      if (!response.ok) {
        lastStatus = response.status;
        lastErrorText = normalizeGemmaApiError(await response.text());
        continue;
      }

      const data = (await response.json()) as GemmaResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        lastStatus = 502;
        lastErrorText = 'Gemma returned no content';
        continue;
      }

      res.status(200).json({ text });
      return;
    }

    res.status(lastStatus).json({
      error: `Gemma API error after trying models [${candidateModels.join(', ')}]: ${lastErrorText}`
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown Gemma server error'
    });
  }
}