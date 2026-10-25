import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const SUGGESTED_PROMPTS = [
  'Create a beginner workout plan for weight loss',
  'What are the best exercises for building core strength?',
  'How many rest days should I take per week?',
  'Explain proper squat form for a beginner',
  'What should I eat before a workout?',
  'How do I track my progress effectively?',
];

const Message = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: isUser ? 'var(--color-accent)' : 'var(--color-surface-2)' }}>
        {isUser
          ? <User size={14} style={{ color: '#000' }} />
          : <Bot size={14} style={{ color: 'var(--color-accent)' }} />
        }
      </div>
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--color-accent)' : 'var(--color-surface-2)',
          color: isUser ? '#000' : 'var(--color-text)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    </div>
  );
};

const AiCoachPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    setInput('');
    setError(null);

    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/coach', { message: messageText, history });

      setMessages((prev) => [...prev, { role: 'model', content: res.data.reply }]);
    } catch (err) {
      if (err.response?.data?.setupRequired) {
        setSetupRequired(true);
        setError(null);
        // Remove the user message since we can't respond
        setMessages((prev) => prev.slice(0, -1));
      } else {
        const errMsg = err.response?.data?.error || 'Failed to get a response. Please try again.';
        setError(errMsg);
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, messages, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (messages.length > 0 && window.confirm('Clear conversation history?')) {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <div className="fade-in max-w-3xl mx-auto h-full flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.15)' }}>
            <Sparkles size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black">AI Fitness Coach</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Powered by Google Gemini
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn btn-ghost btn-sm" title="Clear conversation">
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </div>

      {/* Setup Required Banner */}
      {setupRequired && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4 shrink-0"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#f59e0b' }}>Gemini API Key Required</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Add <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'var(--color-surface-2)' }}>GEMINI_API_KEY</code> to
              your server environment variables to enable AI coaching. Get a free key at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                style={{ color: '#f59e0b' }}>aistudio.google.com</a>.
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-3 rounded-lg mb-4 shrink-0"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          ⚕️ AI coaching provides general fitness guidance only. It is not a substitute for medical advice.
          Always consult a healthcare professional before starting a new exercise program.
          Do not share sensitive personal or medical information.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {/* Welcome */}
        {messages.length === 0 && !setupRequired && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Bot size={32} style={{ color: '#8b5cf6' }} />
            </div>
            <h2 className="text-xl font-bold mb-2">Hi {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              I'm your AI fitness coach. Ask me anything about workouts, nutrition, or your fitness goals.
            </p>

            {/* Suggested prompts */}
            <div className="grid gap-2 max-w-md mx-auto">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-surface-2)' }}>
              <Bot size={14} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
              <Loader size={16} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm p-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!setupRequired && (
        <div className="shrink-0 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI fitness coach…"
              rows={1}
              className="form-input flex-1 resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={loading}
              aria-label="Chat message input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ padding: '0.625rem 1rem' }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-subtle)' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
};

export default AiCoachPage;
