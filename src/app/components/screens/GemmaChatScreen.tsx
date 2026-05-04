import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { GemmaBadge } from '../GemmaBadge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GemmaChatScreenProps {
  onBack: () => void;
}

const SUGGESTED_PROMPTS = [
  'What exercises are best for my phase?',
  'I feel tired today, what should I do?',
  'How can I reduce bloating?',
  'Modify my workout for lower energy',
];

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Hi! I'm your cycle-aware fitness coach powered by Gemma 4. I can help you optimize workouts based on your current phase, energy levels, and goals. What would you like to know?",
  timestamp: new Date()
};

export function GemmaChatScreen({ onBack }: GemmaChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your luteal phase and current energy level, I recommend focusing on low-impact movements today. Your progesterone is elevated, which can affect energy. Consider yoga, walking, or gentle pilates instead of high-intensity training.",
        "Great question! During this phase, your body benefits from exercises that support hormone balance. I'd suggest: modified strength training with longer rest periods, restorative yoga, and gentle cardio like swimming or cycling.",
        "To reduce bloating during your luteal phase, try: avoiding salt 2-3 days before your period, staying hydrated, gentle core exercises (avoid crunches), and anti-inflammatory foods like ginger and leafy greens.",
        "I can modify your workout! Since you're feeling low energy today, let's reduce intensity by 30%, add 15-second rest periods between sets, and swap any high-impact moves for their low-impact versions. Would you like me to create a custom workout?"
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--flowfit-off-white)]">
      {/* Header */}
      <div className="p-6 pt-12 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="flex items-center gap-2 text-[var(--flowfit-sage)]">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <GemmaBadge variant="privacy" />
        </div>
        <h2>Chat with Gemma</h2>
        <p className="text-sm text-[var(--flowfit-text-secondary)]">
          Your AI fitness coach
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-[var(--flowfit-sage)] text-white'
                  : 'bg-white text-[var(--flowfit-text-primary)]'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-[var(--phase-ovulatory)]" />
                  <span className="text-xs text-[var(--flowfit-text-secondary)]">Gemma 4</span>
                </div>
              )}
              <p className="text-sm leading-relaxed">{message.content}</p>
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
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSend(prompt)}
                className="px-4 py-2 bg-white rounded-full text-sm text-[var(--flowfit-text-primary)] border border-gray-200 whitespace-nowrap hover:border-[var(--flowfit-sage)] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about workouts, nutrition, or your cycle..."
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--flowfit-off-white)] border-2 border-transparent focus:border-[var(--flowfit-sage)] transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-[var(--flowfit-sage)] text-white disabled:bg-gray-300 disabled:text-gray-500 transition-colors min-w-[44px]"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
