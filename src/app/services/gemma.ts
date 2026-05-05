type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WorkoutRecommendation {
  name: string;
  duration: string;
  intensity: string;
  phase: string;
  reason: string;
  exercises: string[];
  warmup?: string;
}

export interface WorkoutLogAnalysis {
  energyRating: number;
  completionPercent: number;
  mood: string;
  adjustment: string;
}

export interface HomeInsights {
  cycleDay: number;
  totalDays: number;
  phase: Phase;
  phaseDescription: string;
  stats: {
    streakDays: number;
    workoutsThisWeek: number;
    levelProgress: number;
  };
  phaseTip: string;
  recommendation: WorkoutRecommendation;
}

export interface HomeInsightsInput {
  energyRating: number;
  lastCycleStartDate?: string;
  cycleLength?: number;
  goals?: string[];
  dataSource?: 'manual' | 'google' | null;
}

interface WorkoutRecommendationInput {
  phase: Phase;
  cycleDay: number;
  energyRating: number;
  recentWorkouts: string[];
  goals: string[];
}

interface WorkoutLogInput {
  logText: string;
  phase: Phase;
  cycleDay: number;
}

interface CallGemmaOptions {
  expectsJson?: boolean;
}

export interface GemmaStatus {
  ok: boolean;
  configured: boolean;
  reachable: boolean;
  model: string;
  message: string;
}

function normalizeGemmaErrorMessage(raw: string): string {
  if (raw.includes('PERMISSION_DENIED') || raw.includes('denied access')) {
    return 'PERMISSION_DENIED: This Google Cloud project/key is denied Gemma access. Create/use a different Google Cloud project with Generative Language API + Gemma access enabled.';
  }

  if (raw.includes('API_KEY_INVALID')) {
    return 'API_KEY_INVALID: Your Gemma API key is invalid.';
  }

  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
    return 'RESOURCE_EXHAUSTED: Project quota/rate limit reached for Gemma.';
  }

  return raw;
}

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv) {
    return fromEnv;
  }
  return window.location.origin;
}

function getClientGemmaConfig(): { apiKey?: string; model: string; localOnly: boolean } {
  const apiKey = import.meta.env.VITE_GEMMA_API_KEY as string | undefined;
  const model =
    (import.meta.env.VITE_GEMMA_LOCAL_MODEL as string | undefined) ||
    (import.meta.env.VITE_GEMMA_MODEL as string | undefined) ||
    'gemma-4-31b-it';
  const localOnly = (import.meta.env.VITE_GEMMA_LOCAL_ONLY as string | undefined) === 'true';

  return { apiKey, model, localOnly };
}

function getCandidateGemmaModels(preferred: string): string[] {
  const defaults = ['gemma-4-31b-it', 'gemma-4-26b-a4b-it'];
  return [preferred, ...defaults.filter((m) => m !== preferred)];
}

async function callGemmaViaBackend(prompt: string, options?: CallGemmaOptions): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/api/gemma/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ prompt, expectsJson: !!options?.expectsJson })
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(normalizeGemmaErrorMessage(errorData.error || 'Gemma request failed'));
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error('Empty response from Gemma');
  }

  return data.text;
}

interface DirectGemmaResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

async function callGemmaDirect(
  prompt: string,
  apiKey: string,
  model: string,
  options?: CallGemmaOptions
): Promise<string> {
  const candidateModels = getCandidateGemmaModels(model);
  let lastError = 'Unknown Gemma direct-call error';

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
            ...(options?.expectsJson ? { responseMimeType: 'application/json' } : {})
          }
        })
      }
    );

    if (!response.ok) {
      lastError = await response.text();
      continue;
    }

    const data = (await response.json()) as DirectGemmaResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return text;
    }

    lastError = 'Direct Gemma response did not include text';
  }

  throw new Error(normalizeGemmaErrorMessage(`Direct Gemma request failed: ${lastError}`));
}

async function callGemma(prompt: string, options?: CallGemmaOptions): Promise<string> {
  const { apiKey, model, localOnly } = getClientGemmaConfig();

  // Local-only mode is useful during frontend-only dev (`npm run dev`) without serverless runtime.
  if (localOnly && apiKey) {
    try {
      return await callGemmaDirect(prompt, apiKey, model, options);
    } catch (directError) {
      // Still attempt backend as a rescue path in case server-side key/project has access.
      try {
        return await callGemmaViaBackend(prompt, options);
      } catch {
        throw directError;
      }
    }
  }

  try {
    return await callGemmaViaBackend(prompt, options);
  } catch (backendError) {
    // Graceful local fallback if backend isn't running but a browser key is configured.
    if (apiKey) {
      return callGemmaDirect(prompt, apiKey, model, options);
    }
    throw backendError;
  }
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return text.trim();
}

function parseJson<T>(text: string): T {
  const clean = stripCodeFence(text);

  try {
    return JSON.parse(clean) as T;
  } catch {
    const firstObjectStart = clean.indexOf('{');
    const lastObjectEnd = clean.lastIndexOf('}');
    if (firstObjectStart >= 0 && lastObjectEnd > firstObjectStart) {
      const candidate = clean.slice(firstObjectStart, lastObjectEnd + 1);
      return JSON.parse(candidate) as T;
    }

    const firstArrayStart = clean.indexOf('[');
    const lastArrayEnd = clean.lastIndexOf(']');
    if (firstArrayStart >= 0 && lastArrayEnd > firstArrayStart) {
      const candidate = clean.slice(firstArrayStart, lastArrayEnd + 1);
      return JSON.parse(candidate) as T;
    }

    throw new Error('Gemma did not return valid JSON.');
  }
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  const recentHistory = conversationHistory.slice(-8);
  const historyText = recentHistory
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = [
    'You are Gemma, a cycle-aware fitness coach for an inclusive health app.',
    'Give concise, supportive, practical advice.',
    'Avoid medical diagnosis. If symptoms seem severe, recommend professional care.',
    'Keep responses under 140 words unless user asks for more detail.',
    '',
    'Conversation so far:',
    historyText,
    '',
    `User message: ${userMessage}`,
    '',
    'Reply as assistant only.'
  ].join('\n');

  return callGemma(prompt, { expectsJson: false });
}

export async function parseWorkoutLog(input: WorkoutLogInput): Promise<WorkoutLogAnalysis> {
  const prompt = [
    'Analyze this workout log and return JSON only.',
    'Required keys: energyRating (1-5 integer), completionPercent (0-100 integer), mood (short string), adjustment (one short coaching sentence).',
    `Cycle phase: ${input.phase}`,
    `Cycle day: ${input.cycleDay}`,
    `Workout log: ${input.logText}`,
    '',
    'Return strict JSON with no markdown.'
  ].join('\n');

  const text = await callGemma(prompt, { expectsJson: true });
  const parsed = parseJson<WorkoutLogAnalysis>(text);

  return {
    energyRating: Math.min(5, Math.max(1, Math.round(parsed.energyRating || 3))),
    completionPercent: Math.min(100, Math.max(0, Math.round(parsed.completionPercent || 75))),
    mood: parsed.mood || 'Unknown',
    adjustment: parsed.adjustment || 'No adjustment provided.'
  };
}

export async function getWorkoutRecommendation(
  input: WorkoutRecommendationInput
): Promise<WorkoutRecommendation> {
  const prompt = [
    'Create a personalized workout recommendation and return JSON only.',
    'Required keys: name, duration, intensity, phase, reason, exercises (array of 4 items), warmup.',
    `Phase: ${input.phase}`,
    `Cycle day: ${input.cycleDay}`,
    `Energy rating: ${input.energyRating}`,
    `Recent workouts: ${input.recentWorkouts.join(', ') || 'none'}`,
    `Goals: ${input.goals.join(', ') || 'general fitness'}`,
    'Keep intensity aligned with energy and phase.',
    'Return strict JSON with no markdown.'
  ].join('\n');

  const text = await callGemma(prompt, { expectsJson: true });
  const parsed = parseJson<WorkoutRecommendation>(text);

  if (!parsed.name || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
    throw new Error('Gemma returned incomplete workout recommendation data.');
  }

  return {
    ...parsed,
    exercises: parsed.exercises.slice(0, 4)
  };
}

export async function getHomeInsights(input: HomeInsightsInput): Promise<HomeInsights> {
  const goals = input.goals?.length ? input.goals.join(', ') : 'not specified';
  const lastCycleDate = input.lastCycleStartDate || 'not provided';
  const cycleLength = input.cycleLength || 28;
  const dataSource = input.dataSource || 'manual';

  const prompt = [
    'Generate daily cycle-aware home dashboard data for a fitness app and return JSON only.',
    'Required keys: cycleDay, totalDays, phase, phaseDescription, stats, phaseTip, recommendation.',
    'phase must be one of: menstrual, follicular, ovulatory, luteal.',
    'stats keys: streakDays, workoutsThisWeek, levelProgress.',
    'recommendation keys: name, duration, intensity, phase, reason, exercises (4 items), warmup.',
    `Energy rating today: ${input.energyRating}`,
    `Data source: ${dataSource}`,
    `Last cycle start date: ${lastCycleDate}`,
    `Typical cycle length: ${cycleLength}`,
    `User goals: ${goals}`,
    'Use inclusive language for menstruators.',
    'Return strict JSON with no markdown.'
  ].join('\n');

  const text = await callGemma(prompt, { expectsJson: true });
  const parsed = parseJson<HomeInsights>(text);

  if (!parsed.phase || !parsed.recommendation || !Array.isArray(parsed.recommendation.exercises)) {
    throw new Error('Gemma returned incomplete home insights data.');
  }

  const phase: Phase =
    parsed.phase === 'menstrual' ||
    parsed.phase === 'follicular' ||
    parsed.phase === 'ovulatory' ||
    parsed.phase === 'luteal'
      ? parsed.phase
      : 'follicular';

  return {
    ...parsed,
    phase,
    cycleDay: Math.max(1, Math.round(parsed.cycleDay || 1)),
    totalDays: Math.max(21, Math.round(parsed.totalDays || 28)),
    stats: {
      streakDays: Math.max(0, Math.round(parsed.stats?.streakDays || 0)),
      workoutsThisWeek: Math.max(0, Math.round(parsed.stats?.workoutsThisWeek || 0)),
      levelProgress: Math.max(1, Math.round(parsed.stats?.levelProgress || 1))
    },
    recommendation: {
      ...parsed.recommendation,
      exercises: parsed.recommendation.exercises.slice(0, 4)
    }
  };
}

export async function getGemmaStatus(): Promise<GemmaStatus> {
  const { apiKey, model, localOnly } = getClientGemmaConfig();

  const getLocalStatus = async (): Promise<GemmaStatus> => {
    if (!apiKey) {
      return {
        ok: false,
        configured: false,
        reachable: false,
        model,
        message: 'VITE_GEMMA_API_KEY is not configured for local mode.'
      };
    }

    try {
      const ping = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' }
        }
      );

      if (!ping.ok) {
        const errorText = await ping.text();
        if (errorText.includes('PERMISSION_DENIED') || errorText.includes('denied access')) {
          return {
            ok: false,
            configured: true,
            reachable: false,
            model,
            message:
              'Gemma key is valid format but this project is denied access (PERMISSION_DENIED). Use a different Google Cloud project/key.'
          };
        }

        return {
          ok: false,
          configured: true,
          reachable: false,
          model,
          message: 'Local Gemma key is set, but Google API is unreachable.'
        };
      }

      return {
        ok: true,
        configured: true,
        reachable: true,
        model,
        message: 'Gemma local mode is ready.'
      };
    } catch {
      return {
        ok: false,
        configured: true,
        reachable: false,
        model,
        message: 'Unable to reach Google API in local Gemma mode.'
      };
    }
  };

  if (localOnly) {
    return getLocalStatus();
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/gemma/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        configured: false,
        reachable: false,
        model: 'unknown',
        message: 'Unable to read Gemma status endpoint.'
      };
    }

    return (await response.json()) as GemmaStatus;
  } catch {
    // If backend isn't available in local frontend dev, fall back to checking local mode.
    return getLocalStatus();
  }
}