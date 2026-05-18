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
const FALLBACK_MODELS = ['gemma-2-27b-it', 'gemma-2-9b-it', 'gemma-3-5b-it'] as const;
const MAX_RETRY_ATTEMPTS = 0;
const GEMMA_FETCH_TIMEOUT_MS = 14000;

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

  if (combined.includes('timed out') || combined.includes('timeout') || combined.includes('504')) {
    return 'TIMEOUT: Gemma request timed out. Please retry with a shorter prompt.';
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

    console.log('Gemma chat request:', { 
      model, 
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 10) : 'none',
      apiKeyLength: apiKey?.length 
    });

    if (!apiKey) {
      console.error('GEMMA_API_KEY not configured');
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, GEMMA_FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: expectsJson ? 900 : 420,
                ...(expectsJson ? { responseMimeType: 'application/json' } : {})
              }
            })
          }
        );
      } catch (error) {
        clearTimeout(timeoutId);

        const isTimeout = error instanceof Error && error.name === 'AbortError';
        lastErrorStatus = isTimeout ? 504 : 500;
        lastErrorBody = isTimeout
          ? `Gemma upstream timed out after ${GEMMA_FETCH_TIMEOUT_MS}ms`
          : error instanceof Error
          ? error.message
          : 'Unknown Gemma fetch error';

        if (attempt < MAX_RETRY_ATTEMPTS) {
          await sleep(300 * (attempt + 1));
          continue;
        }

        res.status(lastErrorStatus).json({
          error: `Gemma API error (${model}): ${normalizeGemmaApiError(lastErrorBody)}`
        });
        return;
      }

      clearTimeout(timeoutId);

      if (response.ok) {
        data = (await response.json()) as GemmaResponse;
        break;
      }

      const errorBody = await response.text();
      const parsedError = parseGemmaError(errorBody);

      lastErrorStatus = response.status;
      lastErrorBody = errorBody;

      if (response.status === 500) {
        const parsedError = parseGemmaError(errorBody);
        console.error('Gemma 500 error:', {
          model,
          hasApiKey: !!apiKey,
          errorBody: errorBody.slice(0, 200),
          parsedError
        });
        res.status(500).json({
          error: `Gemma service error (${model}): ${normalizeGemmaApiError(errorBody)}. Check API key validity and model name.`
        });
        return;
      }

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