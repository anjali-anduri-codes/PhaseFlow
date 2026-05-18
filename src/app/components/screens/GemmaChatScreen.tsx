import { useState, useRef, useEffect, ReactNode } from 'react';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { GemmaBadge } from '../GemmaBadge';
import { HomeInsights, WorkoutRecommendation, sendChatMessage } from '../../services/gemma';
import { BottomNav } from '../BottomNav';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workoutPlan?: WorkoutRecommendation | null;
}

interface GemmaChatScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  userName?: string;
  cycleContext?: {
    lastPeriodFrom: string;
    lastPeriodTo: string;
    cycleLength: number;
  } | null;
  goals?: string[];
  latestHomeInsights?: HomeInsights | null;
  onStartWorkoutFromChat?: (plan: WorkoutRecommendation) => void;
  onSaveWorkoutFromChat?: (plan: WorkoutRecommendation) => void;
}

interface WorkoutSections {
  warmup: string[];
  main: string[];
  cooldown: string[];
}

function extractWorkoutPlanFromText(
  content: string,
  fallbackPhase?: string
): WorkoutRecommendation | null {
  const normalized = content.replace(/\r/g, '').trim();
  const hasWorkoutSignals =
    /(workout|routine|training|session|warm[-\s]?up|main workout|cool[-\s]?down|sets?\s*of|sets?\s*x|reps?|seconds?|minutes?)/i.test(
      normalized
    );

  if (!hasWorkoutSignals) {
    return null;
  }

  const exerciseMatches = [
    ...normalized.matchAll(
      /([A-Za-z][A-Za-z\s\-']{2,40}):\s*(\d+\s*sets?\s*(?:x|of)?\s*\d+\s*(?:reps?|seconds?|sec|minutes?|mins)?(?:\s*each side)?)/gi
    )
  ];

  const bulletExerciseMatches = [
    ...normalized.matchAll(
      /(?:^|\n)\s*[-*•]?\s*([A-Za-z][A-Za-z\s\-']{2,60}\s*(?:-\s*)?(?:\d+\s*(?:reps?|seconds?|sec|minutes?|mins)|\d+\s*sets?\s*x\s*\d+[^\n.,;]*))/gim
    )
  ];

  const inlineExerciseMatches = [
    ...normalized.matchAll(
      /(?:^|[;,.]\s*|\-\s*)([A-Za-z][A-Za-z\s\-']{2,60}\s*(?:x\s*\d+|\d+\s*(?:reps?|seconds?|sec|minutes?|mins))(?:\s*(?:\/|per)\s*side)?)/gim
    )
  ];

  const exercises = [
    ...exerciseMatches.map((match) => `${match[1].trim()} - ${match[2].trim()}`),
    ...bulletExerciseMatches.map((match) => match[1].trim()),
    ...inlineExerciseMatches.map((match) => match[1].trim())
  ]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 4);

  if (exercises.length < 2 && !/(warm[-\s]?up|main|cool[-\s]?down)/i.test(normalized)) {
    return null;
  }

  const warmupMatch = normalized.match(/warm[-\s]?up:\s*([^\n.]+(?:\.[^\n.]+)?)/i);
  const reason =
    normalized.match(/(energy|phase|focus|today|workout)[^.!?]{0,120}[.!?]/i)?.[0] ||
    'This plan is tailored to your current cycle phase and today\'s energy.';

  return {
    name: 'Chat-generated workout plan',
    duration: '30-40 min',
    intensity: 'Moderate',
    phase: fallbackPhase || 'Current phase',
    reason: reason.trim(),
    exercises,
    warmup: warmupMatch?.[1]?.trim() || '5 minutes of gentle dynamic warm-up.'
  };
}

function extractWorkoutSections(content: string, plan: WorkoutRecommendation): WorkoutSections {
  const normalized = content.replace(/\r/g, '').trim();
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ''));

  const warmup: string[] = [];
  const main: string[] = [];
  const cooldown: string[] = [];
  let section: 'warmup' | 'main' | 'cooldown' | null = null;

  for (const line of lines) {
    if (/warm[-\s]?up/i.test(line)) {
      section = 'warmup';
      const detail = line.replace(/warm[-\s]?up\s*:?\s*/i, '').trim();
      if (detail) {
        warmup.push(detail);
      }
      continue;
    }

    if (/(main workout|strength|interval|main|circuit)/i.test(line)) {
      section = 'main';
      const detail = line.replace(/(main workout|strength|interval|main|circuit)\s*:?\s*/i, '').trim();
      if (detail && /\d|reps?|sets?|sec|min/i.test(detail)) {
        main.push(detail);
      }
      continue;
    }

    if (/cool[-\s]?down/i.test(line)) {
      section = 'cooldown';
      const detail = line.replace(/cool[-\s]?down\s*:?\s*/i, '').trim();
      if (detail) {
        cooldown.push(detail);
      }
      continue;
    }

    if (!section) {
      continue;
    }

    if (section === 'warmup') {
      warmup.push(line);
    }
    if (section === 'main') {
      main.push(line);
    }
    if (section === 'cooldown') {
      cooldown.push(line);
    }
  }

  const dedupe = (items: string[]) =>
    items
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(0, 4);

  return {
    warmup: dedupe(warmup.length ? warmup : [plan.warmup || '5 minutes of dynamic warm-up.']),
    main: dedupe(main.length ? main : plan.exercises),
    cooldown: dedupe(
      cooldown.length
        ? cooldown
        : ['Child\'s pose breathing - 60 sec', 'Hamstring stretch - 45 sec per side']
    )
  };
}

function buildWorkoutChips(plan: WorkoutRecommendation, content: string): string[] {
  const chips = [plan.duration, plan.intensity, plan.phase];

  if (/(dumbbell|kettlebell|barbell|band|bench|machine)/i.test(content)) {
    chips.push('Equipment');
  } else {
    chips.push('Bodyweight-friendly');
  }

  return chips.filter(Boolean).slice(0, 4);
}

function renderInlineFormatting(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`bold-${index}`}>{segment.slice(2, -2)}</strong>;
    }

    return <span key={`text-${index}`}>{segment}</span>;
  });
}

function renderMessageContent(content: string): ReactNode {
  const paragraphs = content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return <p className="text-sm leading-relaxed">{renderInlineFormatting(content)}</p>;
  }

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split('\n');
        const bulletLines = lines
          .map((line) => line.trim())
          .filter(Boolean)
          .filter((line) => /^[-*•]\s+/.test(line))
          .map((line) => line.replace(/^[-*•]\s+/, ''));

        const isBulletList = bulletLines.length > 0 && bulletLines.length === lines.filter((line) => line.trim()).length;

        if (isBulletList) {
          return (
            <ul key={`paragraph-${index}`} className="space-y-1">
              {bulletLines.map((item, itemIndex) => (
                <li key={`bullet-${itemIndex}`} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-[var(--PhaseFlow-sage)] mt-2 flex-shrink-0" />
                  <span>{renderInlineFormatting(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="text-sm leading-relaxed">
            {lines.map((line, lineIndex) => (
              <span key={`line-${lineIndex}`}>
                {renderInlineFormatting(line)}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const SUGGESTED_PROMPTS = [
  'What exercises are best for my phase?',
  'I feel tired today, what should I do?',
  'How can I reduce bloating?',
  'Modify my workout for lower energy',
];

function createInitialMessage(userName?: string): Message {
  return {
    id: '1',
    role: 'assistant',
    content: userName
      ? `Hi ${userName}! I'm your cycle-aware fitness coach powered by Gemma 4. I can help you optimize workouts based on your current phase, energy levels, and goals. What would you like to know?`
      : "Hi! I'm your cycle-aware fitness coach powered by Gemma 4. I can help you optimize workouts based on your current phase, energy levels, and goals. What would you like to know?",
    timestamp: new Date()
  };
}

export function GemmaChatScreen({
  onBack,
  onNavigate,
  userName,
  cycleContext,
  goals = [],
  latestHomeInsights,
  onStartWorkoutFromChat,
  onSaveWorkoutFromChat
}: GemmaChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(() => [createInitialMessage(userName)]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessageIds, setSavedMessageIds] = useState<Record<string, boolean>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    const nextHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(messageText, nextHistory, {
        userName,
        lastCycleStartDate: cycleContext?.lastCycleStartDate,
        lastPeriodFrom: cycleContext?.lastPeriodFrom,
        lastPeriodTo: cycleContext?.lastPeriodTo,
        cycleLength: cycleContext?.cycleLength,
        goals,
        currentPhase: latestHomeInsights?.phase,
        currentCycleDay: latestHomeInsights?.cycleDay
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        workoutPlan: extractWorkoutPlanFromText(
          reply,
          latestHomeInsights?.phase
            ? `${latestHomeInsights.phase[0].toUpperCase()}${latestHomeInsights.phase.slice(1)} phase`
            : undefined
        )
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Gemma right now. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleRegenerateWorkout = async (
    message: Message,
    mode: 'easier' | 'harder'
  ): Promise<void> => {
    if (!message.workoutPlan || isTyping) {
      return;
    }

    const exerciseText = message.workoutPlan.exercises.join('; ');
    const prompt =
      mode === 'easier'
        ? `Please regenerate this workout as an easier low-impact version for lower energy today. Keep warm-up, main, and cool-down. Base plan: ${exerciseText}`
        : `Please regenerate this workout as a harder version for a stronger training day. Keep warm-up, main, and cool-down. Base plan: ${exerciseText}`;

    await handleSend(prompt);
  };

  const handleSaveWorkout = (message: Message): void => {
    if (!message.workoutPlan || savedMessageIds[message.id]) {
      return;
    }

    onSaveWorkoutFromChat?.(message.workoutPlan);
    setSavedMessageIds((prev) => ({ ...prev, [message.id]: true }));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--PhaseFlow-off-white)]">
      {/* Header */}
      <div className="p-6 pt-12 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="flex items-center gap-2 text-[var(--PhaseFlow-sage)]">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <GemmaBadge variant="privacy" />
        </div>
        <h2>Chat with Gemma</h2>
        <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">
          {userName ? `Your AI fitness coach, ${userName}` : 'Your AI fitness coach'}
        </p>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[84%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`text-xs mb-1 px-1 ${
                  message.role === 'user' ? 'text-right text-[var(--PhaseFlow-text-secondary)]' : 'text-[var(--PhaseFlow-text-secondary)]'
                }`}
              >
                {message.role === 'user' ? (
                  'You'
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--PhaseFlow-sage)]">
                    <Sparkles size={12} />
                    <span>AI</span>
                  </span>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[var(--PhaseFlow-sage)] text-white rounded-br-md'
                    : 'bg-white text-[var(--PhaseFlow-text-primary)] rounded-bl-md border border-gray-100'
                }`}
              >
                <div className={message.role === 'user' ? 'text-white [&_strong]:font-semibold [&_strong]:text-white' : '[&_strong]:font-semibold [&_strong]:text-[var(--PhaseFlow-text-primary)]'}>
                  {renderMessageContent(message.content)}
                </div>

                <div
                  className={`mt-2 text-[11px] ${
                    message.role === 'user' ? 'text-white/80 text-right' : 'text-[var(--PhaseFlow-text-secondary)]'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>

                {message.role === 'assistant' && message.workoutPlan && (
                  <div className="mt-3 rounded-xl border border-[var(--PhaseFlow-mint)] bg-[var(--PhaseFlow-mint)]/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-[var(--PhaseFlow-text-secondary)] mb-1">
                      Generated workout
                    </p>
                    <h4 className="text-sm mb-1">{message.workoutPlan.name}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {buildWorkoutChips(message.workoutPlan, message.content).map((chip) => (
                        <span
                          key={`${message.id}-${chip}`}
                          className="px-2 py-1 rounded-full text-[11px] bg-white border border-[var(--PhaseFlow-mint)] text-[var(--PhaseFlow-text-secondary)]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Warm-up', items: extractWorkoutSections(message.content, message.workoutPlan).warmup },
                        { label: 'Main', items: extractWorkoutSections(message.content, message.workoutPlan).main },
                        { label: 'Cool-down', items: extractWorkoutSections(message.content, message.workoutPlan).cooldown }
                      ].map((section) => (
                        <div key={`${message.id}-${section.label}`} className="rounded-lg bg-white/80 p-2 border border-white">
                          <p className="text-[11px] uppercase tracking-wide text-[var(--PhaseFlow-text-secondary)] mb-1">
                            {section.label}
                          </p>
                          <ul className="space-y-1">
                            {section.items.slice(0, 2).map((item) => (
                              <li key={`${section.label}-${item}`} className="text-xs text-[var(--PhaseFlow-text-primary)]">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleRegenerateWorkout(message, 'easier')}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                        disabled={isTyping}
                      >
                        Make easier
                      </button>
                      <button
                        onClick={() => handleRegenerateWorkout(message, 'harder')}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                        disabled={isTyping}
                      >
                        Make harder
                      </button>
                    </div>

                    <button
                      onClick={() => onStartWorkoutFromChat?.(message.workoutPlan as WorkoutRecommendation)}
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--PhaseFlow-sage)] text-white text-sm"
                    >
                      Start workout
                    </button>

                    <button
                      onClick={() => handleSaveWorkout(message)}
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-white border border-[var(--PhaseFlow-sage)] text-[var(--PhaseFlow-sage)] text-sm"
                    >
                      {savedMessageIds[message.id] ? 'Saved to Your Workouts' : 'Save to Your Workouts'}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="px-4 py-2 bg-white rounded-full text-sm text-[var(--PhaseFlow-text-primary)] border border-gray-200 whitespace-nowrap hover:border-[var(--PhaseFlow-sage)] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 mb-12 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Gemma"
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--PhaseFlow-off-white)] border-2 border-transparent focus:border-[var(--PhaseFlow-sage)] transition-colors"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-xl bg-[var(--PhaseFlow-sage)] text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors min-w-[44px]"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <BottomNav activeScreen="gemma-chat" onNavigate={onNavigate} />
    </div>
  );
}
