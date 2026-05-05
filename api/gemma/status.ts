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
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      res.status(200).json({
        ok: false,
        configured: true,
        reachable: false,
        model,
        message: 'Gemma API key is set but API is not reachable.'
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