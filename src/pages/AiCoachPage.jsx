import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, User, Loader, AlertCircle, RefreshCw, Key,
  CheckCircle2, X, Dumbbell, Zap, Target, ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const QUICK_ACTIONS = [
  { icon: '🏋️‍♂️', label: '4-Day Push/Pull/Legs Split', prompt: 'Give me a 4-day Push-Pull-Legs gym workout split with sets and reps.' },
  { icon: '🎯', label: 'Squat Form & Lower Back Safety', prompt: 'What are the key biomechanics and cues to protect my lower back on barbell squats?' },
  { icon: '🥩', label: 'Optimal Pre/Post Workout Meals', prompt: 'What should I eat before and after lifting heavy weights for maximum energy and recovery?' },
  { icon: '📈', label: 'Overcome Bench Press Plateau', prompt: 'How do I use progressive overload and accessory work to break a bench press plateau?' },
  { icon: '⚡', label: 'Creatine & Daily Protein Target', prompt: 'How much daily protein and creatine do I need to maximize muscle hypertrophy?' },
  { icon: '💤', label: 'DOMS & Muscle Recovery Protocol', prompt: 'What is the fastest way to recover from severe muscle soreness (DOMS) after leg day?' },
];

const TRAINER_RULES = [
  { title: 'Form Over Ego', desc: 'Control the 2-second negative before stacking weight.' },
  { title: 'Progressive Overload', desc: 'Add 1 clean rep or 1-2.5 kg to working sets weekly.' },
  { title: 'Protein Target', desc: 'Aim for 1.6 to 2.2g of protein per kg bodyweight.' },
  { title: 'Systematic Rest', desc: 'Give each muscle group 48 hours to rebuild.' },
];

const MarkdownComponents = {
  h1: ({ _node, ...props }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5" {...props} />,
  h2: ({ _node, ...props }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5" {...props} />,
  h3: ({ _node, ...props }) => <h3 className="text-sm font-semibold text-emerald-400 mt-2.5 mb-1 flex items-center gap-1.5" {...props} />,
  h4: ({ _node, ...props }) => <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-2 mb-1" {...props} />,
  p: ({ _node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-[var(--color-text)]" {...props} />,
  ul: ({ _node, ...props }) => <ul className="list-disc list-outside pl-5 mb-2.5 space-y-1 text-[var(--color-text)]" {...props} />,
  ol: ({ _node, ...props }) => <ol className="list-decimal list-outside pl-5 mb-2.5 space-y-1 text-[var(--color-text)]" {...props} />,
  li: ({ _node, ...props }) => <li className="leading-relaxed pl-0.5" {...props} />,
  strong: ({ _node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ _node, ...props }) => <em className="italic text-zinc-300" {...props} />,
  blockquote: ({ _node, ...props }) => (
    <blockquote className="border-l-2 border-emerald-500/80 pl-3 my-2 italic text-zinc-400 text-xs bg-emerald-500/5 py-1.5 rounded-r" {...props} />
  ),
  code({ _node, inline, children, ...props }) {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/50 text-emerald-400 border border-emerald-500/20" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="p-3 my-2 rounded-lg bg-black/60 text-xs font-mono overflow-x-auto text-emerald-300 border border-zinc-800">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  table: ({ _node, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-gray-800 bg-gray-950/60">
      <table className="w-full text-xs text-left border-collapse" {...props} />
    </div>
  ),
  thead: ({ _node, ...props }) => <thead className="bg-emerald-500/10 border-b border-gray-800 text-emerald-300 uppercase tracking-wider" {...props} />,
  th: ({ _node, ...props }) => <th className="p-2.5 font-bold text-zinc-200" {...props} />,
  td: ({ _node, ...props }) => <td className="p-2.5 border-b border-gray-800/60 text-zinc-300" {...props} />,
  a: ({ _node, ...props }) => (
    <a className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  hr: ({ _node, ...props }) => <hr className="my-3 border-gray-800" {...props} />,
};

const Message = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-emerald-500 text-black font-bold'
            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
        }`}
      >
        {isUser ? <User size={16} /> : <Dumbbell size={16} />}
      </div>
      <div
        className={`max-w-[90%] sm:max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all shadow-sm ${
          isUser
            ? 'bg-emerald-500 text-black font-medium rounded-tr-none'
            : 'bg-gray-900/90 text-[var(--color-text)] border border-gray-800/90 rounded-tl-none shadow-black/40'
        }`}
      >
        {isUser ? (
          <span className="font-semibold text-black">{content}</span>
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
    <div className="fade-in max-w-7xl mx-auto w-full flex-1 flex flex-col h-full min-h-0">
      {/* ─── Top Master Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Dumbbell size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">Coach Alex</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Certified Gym Trainer
              </span>
              {isGeminiActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Live Active
                </span>
              ) : (
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <Key size={11} /> Connect Gemini API
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Strictly focused on Gym Training, Lifting Biomechanics, Progressive Overload & Sports Nutrition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="btn btn-secondary btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Configure Gemini API Key"
          >
            <Key size={13} />
            <span className="hidden sm:inline">API Key</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="btn btn-ghost btn-sm text-xs py-1.5 px-2.5 text-gray-400 hover:text-white"
              title="Clear conversation"
            >
              <RefreshCw size={13} /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Main 2-Column Responsive Console ─────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
        {/* Left/Main Column: Chat Stream & Docked Input (8/12 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full bg-[#111118]/80 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Subtle Gym Scope Bar */}
          <div className="px-4 py-2 border-b border-gray-800/80 bg-gray-950/40 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
              <span className="truncate">Gym & Fitness Only Mode: Ask for splits, form cues, PRs & gym diet</span>
            </div>
            <span className="hidden sm:inline text-gray-500">Coach Alex 🏋️‍♂️</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
            {/* Welcome hero when empty */}
            {messages.length === 0 && !setupRequired && (
              <div className="text-center py-6 sm:py-10 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3.5 bg-emerald-500/10 border border-emerald-500/25 shadow-lg shadow-emerald-500/5">
                  <Dumbbell size={30} className="text-emerald-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5">
                  Ready to train, {user?.name?.split(' ')[0] || 'champ'}? 🏋️‍♂️
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
                  I'm <strong className="text-white">Coach Alex</strong>, your personal gym trainer. Tell me what muscle group you're hitting, ask for strict form corrections, or request customized lifting splits. Let's get to work!
                </p>

                {/* Instant Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {QUICK_ACTIONS.slice(0, 4).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.prompt)}
                      className="p-3 rounded-xl text-xs transition-all bg-gray-900/60 border border-gray-800/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-gray-300 group flex items-start gap-2.5"
                    >
                      <span className="text-lg shrink-0">{action.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white group-hover:text-emerald-300 truncate">
                          {action.label}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {action.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg, i) => (
              <Message key={i} role={msg.role} content={msg.content} />
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Dumbbell size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-900 border border-gray-800 text-xs text-gray-400 flex items-center gap-2">
                  <Loader size={14} className="animate-spin text-emerald-400" />
                  <span>Coach Alex is calculating your gym protocol…</span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Docked Input Box */}
          {!setupRequired && (
            <div className="p-3 sm:p-4 bg-gray-950/80 border-t border-gray-800/80 shrink-0 space-y-2">
              {/* Text Input & Send */}
              <div className="flex items-end gap-2 bg-gray-900/90 border border-gray-700/80 rounded-xl p-1.5 focus-within:border-emerald-500 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your gym trainer (e.g. 'Fix my squat form', '4-day split', 'pre-workout meal')..."
                  rows={1}
                  className="w-full bg-transparent border-0 text-xs sm:text-sm text-white placeholder-gray-500 px-2.5 py-1.5 focus:outline-none resize-none max-h-28"
                  style={{ minHeight: '38px' }}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="btn btn-primary h-9 px-3.5 text-xs font-bold shrink-0 rounded-lg flex items-center justify-center gap-1.5"
                  aria-label="Send message"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
                <span>Press <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line</span>
                <span>💪 Form over ego always</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Panel: Trainer Corner & Focus (4/12 cols, visible on lg) */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-3.5 overflow-y-auto pr-1">
          {/* Card 1: Gym Trainer Rules */}
          <div className="card p-4 bg-[#111118]/80 border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-amber-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Coach's Gym Principles
              </h3>
            </div>
            <div className="space-y-2.5">
              {TRAINER_RULES.map((rule, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800/60">
                  <p className="text-xs font-bold text-emerald-400">{rule.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Quick Topic Shortcuts */}
          <div className="card p-4 bg-[#111118]/80 border-gray-800 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Popular Gym Protocols
              </h3>
            </div>
            <div className="space-y-1.5">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  className="w-full p-2.5 rounded-xl text-left text-xs bg-gray-900/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-gray-800/80 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{action.icon}</span>
                    <span className="text-gray-300 group-hover:text-white truncate font-medium">
                      {action.label}
                    </span>
                  </div>
                  <ChevronRight size={13} className="text-gray-500 group-hover:text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Scope reminder */}
            <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex items-start gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Coach Alex specializes solely in gym training, weightlifting, and athletic nutrition.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Gemini API Key Modal ──────────────────────────────── */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowKeyModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-400">
                  <Key size={16} />
                </div>
                <h2 className="font-bold text-base text-white">Google Gemini API Key</h2>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="btn btn-ghost btn-sm p-1 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveApiKey} className="p-5 space-y-4">
              <p className="text-xs text-gray-400">
                Connect your Google Gemini key for instant AI gym coaching responses.
              </p>
              <div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="form-input text-xs"
                />
              </div>

              {keySuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
                  <CheckCircle2 size={14} /> Key saved successfully!
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={keySaving || !apiKeyInput.trim()}
                  className="btn btn-primary flex-1 text-xs"
                >
                  {keySaving ? 'Saving…' : 'Save Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCoachPage;
