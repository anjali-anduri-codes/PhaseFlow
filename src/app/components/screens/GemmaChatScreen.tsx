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
}

function extractWorkoutPlanFromText(
  content: string,
  fallbackPhase?: string
): WorkoutRecommendation | null {
  const normalized = content.replace(/\r/g, '').trim();
  const hasWorkoutSignals =
    /(warm[-\s]?up|main workout|cool[-\s]?down|sets?\s*of|sets?\s*x|reps?|seconds?|minutes?)/i.test(
      normalized
    );

  if (!hasWorkoutSignals) {
    return null;
  }

  const exerciseMatches = [...normalized.matchAll(/([A-Za-z][A-Za-z\s\-']{2,40}):\s*(\d+\s*sets?\s*(?:x|of)?\s*\d+\s*(?:reps?|seconds?|sec|minutes?|mins)?(?:\s*each side)?)/gi)];
  const exercises = exerciseMatches
    .map((match) => `${match[1].trim()} - ${match[2].trim()}`)
    .filter(Boolean)
    .slice(0, 4);

  if (exercises.length < 2) {
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
  onStartWorkoutFromChat
}: GemmaChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(() => [createInitialMessage(userName)]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="flex-1 overflow-auto p-4 space-y-4">
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
                  <button
                    onClick={() => onStartWorkoutFromChat?.(message.workoutPlan as WorkoutRecommendation)}
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-[var(--PhaseFlow-sage)] text-white text-sm"
                  >
                    Start this workout
                  </button>
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

        <div ref={messagesEndRef} />
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
