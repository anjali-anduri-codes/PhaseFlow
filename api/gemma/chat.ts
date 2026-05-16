type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => {
    json: (payload: unknown) => void;
  };
};

interface GemmaResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const PRIMARY_GEMMA_MODEL = 'gemma-4-31b-it' as const;
const MAX_RETRY_ATTEMPTS = 2;

interface ParsedGemmaError {
  code?: number;
  status?: string;
  message?: string;
  raw: string;
}

function sanitizeGemmaModel(model?: string): typeof PRIMARY_GEMMA_MODEL {
  if (model === PRIMARY_GEMMA_MODEL) {
    return model;
  }

  return PRIMARY_GEMMA_MODEL;
}

function parseGemmaError(raw: string): ParsedGemmaError {
  const fallback: ParsedGemmaError = { raw };

  try {
    const parsed = JSON.parse(raw) as { error?: { code?: number; status?: string; message?: string } };
    const error = parsed.error;
    if (!error) {
      return fallback;
    }

    return {
      code: error.code,
      status: error.status,
      message: error.message,
      raw
    };
  } catch {
    return fallback;
  }
}

function isRetryableGemmaError(statusCode: number, parsed: ParsedGemmaError): boolean {
  if (statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return true;
  }

  return parsed.status === 'INTERNAL' || parsed.status === 'UNAVAILABLE';
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeGemmaApiError(raw: string): string {
  const parsed = parseGemmaError(raw);
  const combined = `${parsed.status ?? ''} ${parsed.message ?? ''} ${raw}`;

  if (combined.includes('PERMISSION_DENIED') || combined.includes('denied access')) {
    return 'PERMISSION_DENIED: This Google Cloud project/key does not have Gemma API access. Use a key from a project with Generative Language API + Gemma access enabled.';
  }

  if (combined.includes('API_KEY_INVALID')) {
    return 'API_KEY_INVALID: The configured GEMMA_API_KEY is invalid.';
  }

  if (combined.includes('RESOURCE_EXHAUSTED') || combined.includes('quota')) {
    return 'RESOURCE_EXHAUSTED: Gemma quota/rate limit reached for this project.';
  }

  if (combined.includes('INTERNAL')) {
    return 'INTERNAL: Gemma had a temporary upstream error. Please retry in a few seconds.';
  }

  if (combined.includes('UNAVAILABLE')) {
    return 'UNAVAILABLE: Gemma service is temporarily unavailable. Please retry shortly.';
  }

  if (parsed.message && parsed.message.trim()) {
    return parsed.message;
  }

  return raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const env = ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ??
      {}) as Record<string, string | undefined>;
    const apiKey = env.GEMMA_API_KEY;
    const model = sanitizeGemmaModel(env.GEMMA_MODEL);

    if (!apiKey) {
      res.status(500).json({ error: 'GEMMA_API_KEY is not configured' });
      return;
    }

    const { prompt, expectsJson } = req.body as { prompt?: string; expectsJson?: boolean };
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    let lastErrorStatus = 500;
    let lastErrorBody = 'Gemma request failed';
    let data: GemmaResponse | null = null;

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
              maxOutputTokens: expectsJson ? 1500 : 700,
              ...(expectsJson ? { responseMimeType: 'application/json' } : {})
            }
          })
        }
      );

      if (response.ok) {
        data = (await response.json()) as GemmaResponse;
        break;
      }

      const errorBody = await response.text();
      const parsedError = parseGemmaError(errorBody);

      lastErrorStatus = response.status;
      lastErrorBody = errorBody;

      if (attempt < MAX_RETRY_ATTEMPTS && isRetryableGemmaError(response.status, parsedError)) {
        // Simple exponential backoff for transient upstream failures.
        await sleep(300 * (attempt + 1));
        continue;
      }

      res.status(response.status).json({
        error: `Gemma API error (${model}): ${normalizeGemmaApiError(errorBody)}`
      });
      return;
    }

    if (!data) {
      res.status(lastErrorStatus).json({
        error: `Gemma API error (${model}): ${normalizeGemmaApiError(lastErrorBody)}`
      });
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      res.status(502).json({ error: `Gemma returned no content (${model})` });
      return;
    }

    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown Gemma server error'
    });
  }
}