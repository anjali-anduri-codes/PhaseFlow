import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMMA_API_KEY;
  const model = process.env.GEMMA_MODEL || 'gemma-4-31b-it';

  if (!apiKey) {
    res.status(200).json({
      ok: false,
      configured: false,
      reachable: false,
      model,
      message: 'GEMMA_API_KEY is not configured.'
    });
    return;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Say OK.' }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 10
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const statusCode = response.status;
      let message = 'Gemma API key is set but API is not reachable.';

      if (statusCode === 401 || statusCode === 403) {
        message = 'Gemma API key is invalid or does not have permission to access this model.';
      } else if (statusCode === 404) {
        message = `Model '${model}' not found. Check GEMMA_MODEL environment variable.`;
      } else if (statusCode === 500) {
        message = `Gemma API returned 500 INTERNAL error. Check API key validity and model name. Response: ${errorBody.slice(0, 100)}`;
      }

      res.status(200).json({
        ok: false,
        configured: true,
        reachable: false,
        model,
        message
      });
      return;
    }

    res.status(200).json({
      ok: true,
      configured: true,
      reachable: true,
      model,
      message: 'Gemma is ready.'
    });
  } catch {
    res.status(200).json({
      ok: false,
      configured: true,
      reachable: false,
      model,
      message: 'Network issue while checking Gemma status.'
    });
  }
}