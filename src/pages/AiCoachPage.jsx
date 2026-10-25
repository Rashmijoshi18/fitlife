import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader, AlertCircle, Sparkles, RefreshCw, Key, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTED_PROMPTS = [
  'What should I eat before a workout?',
  'eating banana with egg is healthy for me while going to gym',
  'Create a beginner workout plan for weight loss',
  'What are the best exercises for building core strength?',
  'Explain proper squat form for a beginner',
  'How do I track my progress effectively?',
];

const MarkdownComponents = {
  h1: ({ node, ...props }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-emerald-400 mt-2 mb-1" {...props} />,
  h4: ({ node, ...props }) => <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-2 mb-1" {...props} />,
  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-[var(--color-text)]" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-5 mb-2 space-y-1 text-[var(--color-text)]" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-5 mb-2 space-y-1 text-[var(--color-text)]" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed pl-0.5" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node, ...props }) => <em className="italic text-zinc-300" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-2 border-emerald-500/70 pl-3 my-2 italic text-zinc-400 text-xs" {...props} />
  ),
  code({ node, inline, className, children, ...props }) {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/40 text-emerald-400 border border-emerald-500/20" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="p-3 my-2 rounded-lg bg-black/50 text-xs font-mono overflow-x-auto text-emerald-300 border border-zinc-800">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-xs text-left border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-black/30 border-b border-[var(--color-border)]" {...props} />,
  th: ({ node, ...props }) => <th className="p-2 font-semibold text-zinc-200" {...props} />,
  td: ({ node, ...props }) => <td className="p-2 border-b border-[var(--color-border-subtle)] text-zinc-300" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  hr: ({ node, ...props }) => <hr className="my-3 border-[var(--color-border)]" {...props} />,
};

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
        className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--color-accent)' : 'var(--color-surface-2)',
          color: isUser ? '#000' : 'var(--color-text)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          whiteSpace: isUser ? 'pre-wrap' : 'normal',
        }}
      >
        {isUser ? (
          content
        ) : (
          <div className="chat-markdown prose-neutral">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}
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
  const [isGeminiActive, setIsGeminiActive] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keySuccess, setKeySuccess] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Check Gemini status on mount
  useEffect(() => {
    const hasClientKey = Boolean(
      localStorage.getItem('fitlife_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY
    );
    if (hasClientKey) {
      setIsGeminiActive(true);
      setSetupRequired(false);
    }

    const checkStatus = async () => {
      try {
        const res = await api.get('/ai/status');
        if (res.data?.configured) {
          setIsGeminiActive(true);
          setSetupRequired(false);
        }
      } catch {
        // Fallback / mock mode
      }
    };
    checkStatus();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveApiKey = async (e) => {
    e?.preventDefault();
    if (!apiKeyInput.trim()) return;
    setKeySaving(true);
    setError(null);
    try {
      localStorage.setItem('fitlife_gemini_key', apiKeyInput.trim());
      await api.post('/ai/set-key', { apiKey: apiKeyInput.trim() });
      setIsGeminiActive(true);
      setSetupRequired(false);
      setKeySuccess(true);
      setTimeout(() => {
        setKeySuccess(false);
        setShowKeyModal(false);
        setApiKeyInput('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save API key. Please check the key format.');
    } finally {
      setKeySaving(false);
    }
  };

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
      if (res.data?.source === 'gemini-live') {
        setIsGeminiActive(true);
      }
    } catch (err) {
      if (err.response?.data?.setupRequired) {
        setSetupRequired(true);
        setError(null);
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">AI Fitness Coach</h1>
              {isGeminiActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini 3 Flash Live
                </span>
              ) : (
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                  title="Configure Google Gemini API Key"
                >
                  <Key size={11} />
                  Connect Gemini API
                </button>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {isGeminiActive ? 'Powered by Google Gemini 3 Flash' : 'AI Powered Fitness & Nutrition Guidance'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Configure Gemini API Key"
          >
            <Key size={13} />
            <span className="hidden sm:inline">API Key</span>
          </button>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn btn-ghost btn-sm" title="Clear conversation">
              <RefreshCw size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="card w-full max-w-md p-6 relative border border-[var(--color-border)] shadow-2xl">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Google Gemini API Key</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Connect official Google Gemini for live AI coaching</p>
              </div>
            </div>

            {keySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-sm my-4">
                <CheckCircle2 size={18} />
                <span>Google Gemini API connected and activated!</span>
              </div>
            ) : (
              <form onSubmit={saveApiKey} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Enter your Gemini API Key</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="form-input w-full font-mono text-sm"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1">
                    Get a free API key at{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline hover:text-emerald-300"
                    >
                      aistudio.google.com
                    </a>
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!apiKeyInput.trim() || keySaving}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    {keySaving ? <Loader size={14} className="animate-spin" /> : <Key size={14} />}
                    <span>Save & Connect</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Setup Required Banner */}
      {setupRequired && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4 shrink-0"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#f59e0b' }}>Gemini API Key Setup</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Click{' '}
              <button
                onClick={() => setShowKeyModal(true)}
                className="underline font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Connect Gemini API
              </button>{' '}
              to paste your key, or get a free key at{' '}
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
