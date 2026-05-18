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
  userName?: string;
  lastCycleStartDate?: string;
  lastPeriodFrom?: string;
  lastPeriodTo?: string;
  cycleLength?: number;
  goals?: string[];
  dataSource?: 'manual' | 'google' | null;
}

export interface ChatContext {
  userName?: string;
  lastCycleStartDate?: string;
  lastPeriodFrom?: string;
  lastPeriodTo?: string;
  cycleLength?: number;
  goals?: string[];
  currentPhase?: Phase;
  currentCycleDay?: number;
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

interface HomeRecommendationPartial {
  name?: string;
  duration?: string;
  intensity?: string;
  phase?: string;
  reason?: string;
  exercises?: string[];
  warmup?: string;
}

export interface GemmaStatus {
  ok: boolean;
  configured: boolean;
  reachable: boolean;
  model: string;
  message: string;
}

function normalizeGemmaErrorMessage(raw: unknown): string {
  const normalizedRaw =
    typeof raw === 'string'
      ? raw
      : raw instanceof Error
      ? raw.message
      : typeof raw === 'object' && raw !== null
      ? JSON.stringify(raw)
      : String(raw);

  if (normalizedRaw.includes('PERMISSION_DENIED') || normalizedRaw.includes('denied access')) {
    return 'PERMISSION_DENIED: This Google Cloud project/key is denied Gemma access. Create/use a different Google Cloud project with Generative Language API + Gemma access enabled.';
  }

  if (normalizedRaw.includes('API_KEY_INVALID')) {
    return 'API_KEY_INVALID: Your Gemma API key is invalid.';
  }

  if (normalizedRaw.includes('RESOURCE_EXHAUSTED') || normalizedRaw.includes('quota')) {
    return 'RESOURCE_EXHAUSTED: Project quota/rate limit reached for Gemma.';
  }

  if (normalizedRaw.includes('INTERNAL')) {
    return 'INTERNAL: Gemma had a temporary upstream error. Please retry in a few seconds.';
  }

  if (normalizedRaw.includes('UNAVAILABLE')) {
    return 'UNAVAILABLE: Gemma service is temporarily unavailable. Please retry shortly.';
  }

  return normalizedRaw;
}

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv) {
    return fromEnv;
  }
  return window.location.origin;
}

const PRIMARY_GEMMA_MODEL = 'gemma-4-31b-it' as const;

function sanitizeGemmaModel(model?: string): typeof PRIMARY_GEMMA_MODEL {
  if (model === PRIMARY_GEMMA_MODEL) {
    return model;
  }

  return PRIMARY_GEMMA_MODEL;
}

function getClientGemmaConfig(): { apiKey?: string; model: string; localOnly: boolean } {
  const apiKey = import.meta.env.VITE_GEMMA_API_KEY as string | undefined;
  const configuredModel =
    (import.meta.env.VITE_GEMMA_LOCAL_MODEL as string | undefined) ||
    (import.meta.env.VITE_GEMMA_MODEL as string | undefined);
  const model = sanitizeGemmaModel(configuredModel);
  const localOnly = (import.meta.env.VITE_GEMMA_LOCAL_ONLY as string | undefined) === 'true';

  return { apiKey, model, localOnly };
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
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: unknown;
      message?: string;
      code?: string | number;
    };
    const rawError =
      errorData.error ??
      errorData.message ??
      (errorData.code ? `Gemma request failed (${errorData.code})` : undefined) ??
      'Gemma request failed';
    throw new Error(normalizeGemmaErrorMessage(rawError));
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
  const normalizedModel = sanitizeGemmaModel(model);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${apiKey}`,
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
          maxOutputTokens: options?.expectsJson ? 1500 : 700,
          ...(options?.expectsJson ? { responseMimeType: 'application/json' } : {})
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      normalizeGemmaErrorMessage(
        `Direct Gemma request failed (${normalizedModel}): ${await response.text()}`
      )
    );
  }

  const data = (await response.json()) as DirectGemmaResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Direct Gemma response did not include text (${normalizedModel})`);
  }

  return text;
}

async function callGemma(prompt: string, options?: CallGemmaOptions): Promise<string> {
  const { apiKey, model, localOnly } = getClientGemmaConfig();

  // Single-request strategy: choose exactly one path, no fallback retries.
  if (localOnly && apiKey) {
    return callGemmaDirect(prompt, apiKey, model, options);
  }

  return callGemmaViaBackend(prompt, options);
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

interface CycleTimeline {
  cycleDay: number;
  totalDays: number;
  phase: Phase;
  daysUntilNextPeriod: number;
}

function parseIsoDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function diffInCalendarDays(a: Date, b: Date): number {
  const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((aUtc - bUtc) / msPerDay);
}

function inferPhaseFromCycleDay(cycleDay: number, cycleLength: number): Phase {
  const menstruationEnd = 5;
  const lutealStart = Math.max(menstruationEnd + 1, cycleLength - 13);
  const ovulationCenter = Math.max(menstruationEnd + 1, cycleLength - 14);
  const ovulationStart = Math.max(menstruationEnd + 1, ovulationCenter - 1);
  const ovulationEnd = Math.min(lutealStart - 1, ovulationCenter + 1);

  if (cycleDay <= menstruationEnd) {
    return 'menstrual';
  }

  if (cycleDay >= lutealStart) {
    return 'luteal';
  }

  if (cycleDay >= ovulationStart && cycleDay <= ovulationEnd) {
    return 'ovulatory';
  }

  return 'follicular';
}

function deriveCycleTimeline(input: {
  lastCycleStartDate?: string;
  lastPeriodFrom?: string;
  cycleLength?: number;
}): CycleTimeline | null {
  const cycleLength = Math.min(35, Math.max(21, Math.round(input.cycleLength || 28)));
  const startDate = parseIsoDate(input.lastCycleStartDate || input.lastPeriodFrom);
  if (!startDate) {
    return null;
  }

  const today = new Date();
  const rawDaysSinceStart = diffInCalendarDays(today, startDate);
  const normalizedDaysSinceStart = ((rawDaysSinceStart % cycleLength) + cycleLength) % cycleLength;
  const cycleDay = normalizedDaysSinceStart + 1;
  const daysUntilNextPeriod = cycleLength - cycleDay;
  const phase = inferPhaseFromCycleDay(cycleDay, cycleLength);

  return {
    cycleDay,
    totalDays: cycleLength,
    phase,
    daysUntilNextPeriod
  };
}

function sanitizeChatReply(raw: string): string {
  let text = stripCodeFence(raw).trim();

  // If the model wraps the final answer in quotes after planning text, prefer that quoted answer.
  const quotedAnswers = [...text.matchAll(/"([^"\n]{24,})"/g)].map((match) => match[1]?.trim());
  if (quotedAnswers.length > 0) {
    const longest = quotedAnswers.sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
    if (longest) {
      text = longest;
    }
  }

  const leakedPlanning =
    /(Persona:|Constraint:|Current User State:|Draft\s*\d+|Cycle Status:|Style:|Characteristics:|Current Goal:|Context:|Structure:|No labels\?:|Gemma\s*4|Tone:|Length:|Conversation so far:|User message:|Reply as assistant)/i;
  if (leakedPlanning.test(text)) {
    const draftMatch = text.match(/Draft\s*\d+\s*:\*?\s*([\s\S]*)/i);
    if (draftMatch?.[1]) {
      text = draftMatch[1].trim();
    }

    const filtered = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*]\s*/, ''))
      .filter((line) => !isInstructionLine(line))
      .join(' ')
      .trim();

    if (filtered) {
      text = filtered;
    }
  }

  return text
    .replace(/^\*+\s*Draft\s*\d+\s*:\*?\s*/i, '')
    .replace(/^Gemma\s*4\s*/i, '')
    .replace(/^Current Goal:\s*.*$/gim, '')
    .replace(/^Context:\s*.*$/gim, '')
    .replace(/^Structure:\s*.*$/gim, '')
    .replace(/^Style:\s*.*$/gim, '')
    .replace(/^Characteristics:\s*.*$/gim, '')
    .replace(/^No labels\?:\s*.*$/gim, '')
    .replace(/^Tone:\s*.*$/gim, '')
    .replace(/^Length:\s*.*$/gim, '')
    .replace(/^Address\s+.*$/gim, '')
    .replace(/^Be\s+supportive\.?$/gim, '')
    .replace(/^Keep\s+it\s+concise\.?$/gim, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isInstructionLine(line))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isInstructionLine(line: string): boolean {
  return /^(Gemma\s*4|Style|Characteristics|Current Goal|Context|Structure|Persona|User|Cycle Status|Current User State|Goal|Constraint|Phase|Typical hormonal shift|Acknowledge|Explain|Suggest|Recommend|Encourage|Concise\?|Supportive\?|Practical\?|No medical diagnosis\?|Under 140 words\?|Addressed .+\?|Cycle-aware\?|No labels\?|Tone|Length|Conversation so far|User message|Reply as assistant|Warm-up \(\d+ mins\)|Main Workout|Cool-down \(\d+ mins\)|Be supportive|Keep it concise)$/i.test(
    line
  );
}

function containsPromptLeak(text: string): boolean {
  return /(tone:\s|length:\s|conversation so far:|user message:|reply as assistant|be supportive\.?|keep it concise\.?|output only the final answer|address\s+\w+)/i.test(
    text
  );
}

function normalizeForEchoCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEchoResponse(reply: string, userMessage: string): boolean {
  const normalizedReply = normalizeForEchoCheck(reply);
  const normalizedUser = normalizeForEchoCheck(userMessage);

  if (!normalizedReply || !normalizedUser) {
    return false;
  }

  if (normalizedReply === normalizedUser) {
    return true;
  }

  if (normalizedUser.length >= 18 && normalizedReply.includes(normalizedUser)) {
    return true;
  }

  const userTokens = normalizedUser.split(' ').filter((word) => word.length >= 4);
  if (userTokens.length >= 5) {
    let overlap = 0;
    for (const token of userTokens) {
      if (normalizedReply.includes(token)) {
        overlap += 1;
      }
    }

    const overlapRatio = overlap / userTokens.length;
    if (overlapRatio >= 0.8 && normalizedReply.length <= normalizedUser.length * 1.4) {
      return true;
    }
  }

  return false;
}

function userAskedForWorkout(userMessage: string): boolean {
  return /(workout|routine|exercise|training|session|warm[-\s]?up|cool[-\s]?down|detailed workout flow|plan)/i.test(
    userMessage
  );
}

function getWorkoutFallbackReply(userName: string | undefined, currentPhase: Phase | 'unknown'): string {
  const intro = userName ? `Hi ${userName},` : 'Here is a practical workout flow:';
  const phaseLine =
    currentPhase !== 'unknown'
      ? `For your ${currentPhase} phase, keep effort steady and controlled.`
      : 'Keep effort steady and controlled, and adjust intensity to your energy today.';

  return [
    intro,
    phaseLine,
    'Warm-up (5 min): arm circles, leg swings, cat-cow, bodyweight squats.',
    'Main (20-25 min): 3 rounds - squats x12, incline push-ups x10, glute bridges x15, dead bug x10/side; rest 45-60 sec.',
    'Finisher (4 min): brisk march or low-impact step intervals (40 sec on, 20 sec easy).',
    'Cool-down (5 min): child\'s pose, hamstring stretch, hip flexor stretch, slow breathing.'
  ].join(' ');
}

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context?: ChatContext
): Promise<string> {
  const recentHistory = conversationHistory.slice(-8);
  const historyText = recentHistory
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
  const userName = context?.userName?.trim();
  const goals = context?.goals?.length ? context.goals.join(', ') : 'not specified';
  const lastPeriodFrom = context?.lastPeriodFrom || 'not provided';
  const lastPeriodTo = context?.lastPeriodTo || 'not provided';
  const cycleLength = context?.cycleLength || 'not provided';
  const timeline = deriveCycleTimeline({
    lastCycleStartDate: context?.lastCycleStartDate,
    lastPeriodFrom: context?.lastPeriodFrom,
    cycleLength: context?.cycleLength
  });
  const currentPhase = context?.currentPhase || timeline?.phase || 'unknown';
  const currentCycleDay = context?.currentCycleDay || timeline?.cycleDay || 'unknown';

  const prompt = [
    'You are Gemma, a cycle-aware fitness coach for an inclusive health app.',
    'Give concise, supportive, practical advice.',
    'Avoid medical diagnosis. If symptoms seem severe, recommend professional care.',
    'Keep responses under 140 words unless user asks for more detail.',
    'Do not repeat the user message back. Give fresh, concrete coaching content.',
    'Output only the final answer to the user. Do not output analysis, planning notes, bullets about constraints, drafts, or self-evaluation.',
    'Never include labels such as Persona, User, Cycle Status, Goal, Constraint, Draft, or checklists.',
    userName ? `The user is named ${userName}. Address them by name naturally.` : 'Use a warm conversational tone.',
    `Last period window: ${lastPeriodFrom} to ${lastPeriodTo}`,
    `Typical cycle length: ${cycleLength}`,
    timeline
      ? `Computed cycle status from dates: day ${timeline.cycleDay}/${timeline.totalDays}, phase ${timeline.phase}, next period in about ${timeline.daysUntilNextPeriod} day(s).`
      : 'Computed cycle status from dates: unavailable.',
    `Current known phase/day: ${currentPhase} / ${currentCycleDay}`,
    `User goals: ${goals}`,
    '',
    'Conversation so far:',
    historyText,
    '',
    `User message: ${userMessage}`,
    '',
    'Reply as assistant only with one final user-facing response.'
  ].join('\n');

  const raw = await callGemma(prompt, { expectsJson: false });
  const cleaned = sanitizeChatReply(raw);

  if (!cleaned || containsPromptLeak(cleaned) || isEchoResponse(cleaned, userMessage)) {
    if (userAskedForWorkout(userMessage)) {
      return getWorkoutFallbackReply(userName, currentPhase);
    }

    const greeting = userName ? `Hi ${userName}, ` : '';
    const phaseText = currentPhase !== 'unknown' ? `in your ${currentPhase} phase` : 'today';
    return `${greeting}thanks for sharing. Based on where you are ${phaseText}, try a 5-minute warm-up, then 2-3 focused strength or low-impact intervals, and finish with a short cool-down. Keep intensity at a level where you can still breathe steadily, and adjust if your energy dips.`;
  }

  return cleaned;
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
  let parsed: Partial<WorkoutLogAnalysis> = {};

  try {
    parsed = parseJson<WorkoutLogAnalysis>(text);
  } catch {
    // Keep flow working if Gemma sends plain text instead of JSON.
    parsed = {};
  }

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

function getPhaseRecommendationDefaults(phase: Phase): WorkoutRecommendation {
  switch (phase) {
    case 'menstrual':
      return {
        name: 'Low-impact recovery flow',
        duration: '20-30 min',
        intensity: 'Low',
        phase: 'Menstrual phase',
        reason: 'Focus on comfort, circulation, and gentle mobility while energy may be lower.',
        exercises: [
          'Diaphragmatic breathing in 90/90 - 2 sets x 60 sec',
          'Cat-cow and child\'s pose flow - 2 sets x 8 reps',
          'Glute bridges (slow tempo) - 2 sets x 10 reps',
          'Supported hamstring + hip flexor stretch - 2 sets x 45 sec'
        ],
        warmup: '3-5 minutes of relaxed breathing and gentle spine mobility.'
      };
    case 'follicular':
      return {
        name: 'Progressive strength builder',
        duration: '30-40 min',
        intensity: 'Moderate',
        phase: 'Follicular phase',
        reason: 'Use rising energy for progressive overload and skill practice.',
        exercises: [
          'Goblet squat progression - 3 sets x 10-12 reps',
          'Push-up progression (incline or floor) - 3 sets x 8-10 reps',
          'Romanian deadlift with dumbbells/bands - 3 sets x 10 reps',
          'Plank with shoulder taps - 3 sets x 30 sec'
        ],
        warmup: '5 minutes of dynamic warmup with leg swings and thoracic rotations.'
      };
    case 'ovulatory':
      return {
        name: 'Power and performance circuit',
        duration: '30-45 min',
        intensity: 'Moderate-High',
        phase: 'Ovulatory phase',
        reason: 'Capitalize on peak energy with controlled power and athletic work.',
        exercises: [
          'Squat-to-press power reps - 4 sets x 8 reps',
          'Lateral bounds or side skaters - 4 sets x 20 sec',
          'Alternating reverse lunges - 3 sets x 10 each side',
          'Dead bug (controlled tempo) - 3 sets x 12 reps'
        ],
        warmup: '5 minutes of dynamic activation including hips, glutes, and shoulders.'
      };
    case 'luteal':
    default:
      return {
        name: 'Steady-state strength and core',
        duration: '25-35 min',
        intensity: 'Moderate',
        phase: 'Luteal phase',
        reason: 'Prioritize steady effort, lower stress load, and core stability as fatigue can rise.',
        exercises: [
          'Tempo split squats (controlled eccentric) - 3 sets x 8 each side',
          'Banded rows or dumbbell rows - 3 sets x 10 reps',
          'Pallof press anti-rotation holds - 3 sets x 30 sec each side',
          'Low-impact incline walk or marching cooldown - 1 set x 4 min'
        ],
        warmup: '4-5 minutes of breathing, glute activation, and gentle mobility.'
      };
  }
}

function normalizePhaseExercises(phase: Phase, exercises: string[] | undefined): string[] {
  const defaults = getPhaseRecommendationDefaults(phase).exercises;
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return defaults;
  }

  const trimmed = exercises.filter(Boolean).slice(0, 4);
  const phaseAnchors: Record<Phase, RegExp> = {
    menstrual: /(breathing|cat-cow|child|bridge|mobility|stretch)/i,
    follicular: /(squat|push|deadlift|progression|strength)/i,
    ovulatory: /(power|bounds|skater|press|athletic)/i,
    luteal: /(tempo|row|pallof|core|steady|low-impact)/i
  };

  if (!trimmed.some((exercise) => phaseAnchors[phase].test(exercise))) {
    trimmed[0] = defaults[0];
  }

  while (trimmed.length < 4) {
    trimmed.push(defaults[trimmed.length]);
  }

  return trimmed;
}

function normalizeHomeRecommendation(
  phase: Phase,
  recommendation: HomeRecommendationPartial | undefined
): WorkoutRecommendation {
  const defaults = getPhaseRecommendationDefaults(phase);

  return {
    name: recommendation?.name || defaults.name,
    duration: recommendation?.duration || defaults.duration,
    intensity: recommendation?.intensity || defaults.intensity,
    phase: recommendation?.phase || defaults.phase,
    reason: recommendation?.reason || defaults.reason,
    exercises: normalizePhaseExercises(phase, recommendation?.exercises),
    warmup: recommendation?.warmup || defaults.warmup
  };
}

export async function getHomeInsights(input: HomeInsightsInput): Promise<HomeInsights> {
  const goals = input.goals?.length ? input.goals.join(', ') : 'not specified';
  const userName = input.userName || 'not provided';
  const lastCycleDate = input.lastCycleStartDate || 'not provided';
  const lastPeriodFrom = input.lastPeriodFrom || 'not provided';
  const lastPeriodTo = input.lastPeriodTo || 'not provided';
  const cycleLength = input.cycleLength || 28;
  const dataSource = input.dataSource || 'manual';
  const timeline = deriveCycleTimeline({
    lastCycleStartDate: input.lastCycleStartDate,
    lastPeriodFrom: input.lastPeriodFrom,
    cycleLength: input.cycleLength
  });

  const prompt = [
    'Generate daily cycle-aware home dashboard data for a fitness app and return JSON only.',
    'Required keys: cycleDay, totalDays, phase, phaseDescription, stats, phaseTip, recommendation.',
    'phase must be one of: menstrual, follicular, ovulatory, luteal.',
    'stats keys: streakDays, workoutsThisWeek, levelProgress.',
    'recommendation keys: name, duration, intensity, phase, reason, exercises (4 items), warmup.',
    'Each exercise must include set/rep or timed format, e.g. "Goblet squat - 3 sets x 10 reps" or "Plank - 3 sets x 30 sec".',
    'Do not reuse the same workout profile across phases; make movements phase-specific.',
    'Menstrual should favor gentle mobility/recovery, luteal should favor steady moderate strength/core.',
    `User name: ${userName}`,
    `User check-in response for "How do you feel today?": energy ${input.energyRating}/5`,
    `Data source: ${dataSource}`,
    `Last Period from: ${lastPeriodFrom}`,
    `Last Period to: ${lastPeriodTo}`,
    `Last cycle start date: ${lastCycleDate}`,
    `Typical cycle length: ${cycleLength}`,
    timeline
      ? `Computed cycle status from dates (authoritative): day ${timeline.cycleDay}/${timeline.totalDays}, phase ${timeline.phase}, next period expected in about ${timeline.daysUntilNextPeriod} day(s).`
      : 'Computed cycle status from dates: unavailable.',
    `User goals: ${goals}`,
    'Use inclusive language for menstruators.',
    'When computed cycle status is provided, keep phase/day consistent with it.',
    'Return strict JSON with no markdown.'
  ].join('\n');

  const text = await callGemma(prompt, { expectsJson: true });
  let parsed: Partial<HomeInsights> = {};

  try {
    parsed = parseJson<Partial<HomeInsights>>(text);
  } catch {
    // Gemma can occasionally return plain text despite JSON instructions.
    // Keep the app usable by falling back to timeline-driven defaults.
    parsed = {};
  }

  const parsedPhase: Phase | null =
    parsed.phase === 'menstrual' ||
    parsed.phase === 'follicular' ||
    parsed.phase === 'ovulatory' ||
    parsed.phase === 'luteal'
      ? parsed.phase
      : null;
  const phase: Phase = timeline?.phase || parsedPhase || 'follicular';
  const cycleDay = timeline?.cycleDay || Math.max(1, Math.round(parsed.cycleDay || 1));
  const totalDays = timeline?.totalDays || Math.max(21, Math.round(parsed.totalDays || 28));

  return {
    cycleDay,
    totalDays,
    phase,
    phaseDescription:
      parsed.phaseDescription ||
      'Tune your workout intensity to your current cycle phase and energy level today.',
    stats: {
      streakDays: Math.max(0, Math.round(parsed.stats?.streakDays || 0)),
      workoutsThisWeek: Math.max(0, Math.round(parsed.stats?.workoutsThisWeek || 0)),
      levelProgress: Math.max(1, Math.round(parsed.stats?.levelProgress || 1))
    },
    phaseTip: parsed.phaseTip || 'Stay consistent and adjust intensity to your energy today.',
    recommendation: normalizeHomeRecommendation(phase, parsed.recommendation)
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