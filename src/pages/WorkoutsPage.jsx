import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Dumbbell, Clock, Flame, Trash2, Edit2, ChevronDown, ChevronUp,
  X, Camera, Zap, Sparkles, RotateCcw, ArrowRight, HeartPulse,
  Send, Footprints, FlameKindling
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const WORKOUT_TYPES = [
  { id: 'strength', label: 'Strength', icon: Dumbbell, color: '#10b981', met: 6.0, defaultTitle: 'Strength Workout' },
  { id: 'cardio', label: 'Cardio', icon: HeartPulse, color: '#3b82f6', met: 8.5, defaultTitle: 'Cardio Session' },
  { id: 'hiit', label: 'HIIT', icon: FlameKindling, color: '#ef4444', met: 10.0, defaultTitle: 'High Intensity Interval' },
  { id: 'flexibility', label: 'Yoga & Stretch', icon: Sparkles, color: '#8b5cf6', met: 3.5, defaultTitle: 'Yoga & Flexibility' },
  { id: 'sports', label: 'Sports', icon: Zap, color: '#f59e0b', met: 7.5, defaultTitle: 'Sports Training' },
  { id: 'other', label: 'Other', icon: Footprints, color: '#9ca3af', met: 5.0, defaultTitle: 'Daily Activity' },
];

const PRESETS = [
  { id: 'p1', title: 'Full Body Strength', type: 'strength', defaultDuration: 45, icon: '🏋️‍♂️' },
  { id: 'p2', title: 'Cardio Run / Jog', type: 'cardio', defaultDuration: 30, icon: '🏃‍♂️' },
  { id: 'p3', title: 'HIIT Fat Burner', type: 'hiit', defaultDuration: 20, icon: '🔥' },
  { id: 'p4', title: 'Morning Yoga Flow', type: 'flexibility', defaultDuration: 25, icon: '🧘‍♀️' },
  { id: 'p5', title: 'Cycling Session', type: 'cardio', defaultDuration: 35, icon: '🚴' },
  { id: 'p6', title: 'Brisk Power Walk', type: 'cardio', defaultDuration: 30, icon: '🚶' },
  { id: 'p7', title: 'Boxing / Kickboxing', type: 'sports', defaultDuration: 30, icon: '🥊' },
  { id: 'p8', title: 'Swimming Laps', type: 'sports', defaultDuration: 30, icon: '🏊' },
];

const QUICK_PROMPTS = [
  'Ran 5k in 25 min',
  '45 min chest & triceps strength',
  '20 min HIIT cardio burn',
  '30 min morning yoga stretch',
  '40 min outdoor cycling',
  '30 min brisk walk',
];

const MOODS = [
  { id: 'great', label: 'Great', emoji: '🔥' },
  { id: 'good', label: 'Good', emoji: '😊' },
  { id: 'okay', label: 'Okay', emoji: '😐' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
];

// Helper: Calculate scientifically backed calories based on ACSM MET, weight and duration
const calculateBurn = (type, durationMinutes, weightKg = 70) => {
  const metMap = { strength: 6.0, cardio: 8.5, hiit: 10.0, flexibility: 3.5, sports: 7.5, other: 5.0 };
  const met = metMap[type] || 5.5;
  const weight = Math.max(40, Math.min(180, Number(weightKg) || 70));
  const minutes = Math.max(1, Number(durationMinutes) || 0);
  return Math.round((met * 3.5 * weight / 200) * minutes);
};

// Streamlined User-Friendly Quick Log Modal (Zero tedious manual calculations)
const UserFriendlyWorkoutModal = ({ onClose, onSaved, existing, userWeight }) => {
  const [type, setType] = useState(existing?.type || 'strength');
  const [duration, setDuration] = useState(existing?.duration || 30);
  const [title, setTitle] = useState(existing?.title || 'Strength Workout');
  const [titleCustomized, setTitleCustomized] = useState(Boolean(existing?.title));
  const [date, setDate] = useState(existing?.date ? format(parseISO(existing.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [mood, setMood] = useState(existing?.mood || 'great');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [showAdvanced, setShowAdvanced] = useState(Boolean(existing?.notes));
  const [customCalories, setCustomCalories] = useState(existing?.caloriesBurned || '');
  const [isCustomCal, setIsCustomCal] = useState(Boolean(existing?.caloriesBurned));
  const [loading, setLoading] = useState(false);

  // Auto-calculated calories
  const autoCalories = useMemo(() => calculateBurn(type, duration, userWeight), [type, duration, userWeight]);
  const finalCalories = isCustomCal && customCalories !== '' ? Number(customCalories) : autoCalories;

  // When type changes, auto-set default title unless user customized it
  const handleSelectType = (selectedType) => {
    setType(selectedType);
    if (!titleCustomized || !title.trim()) {
      const match = WORKOUT_TYPES.find(t => t.id === selectedType);
      setTitle(match ? match.defaultTitle : 'Workout Session');
    }
  };

  const handleDurationPreset = (mins) => {
    setDuration(mins);
  };

  const handleAdjustDuration = (delta) => {
    setDuration(prev => Math.max(5, Math.min(300, (Number(prev) || 30) + delta)));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title or choose an activity');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        type,
        duration: Number(duration) || 30,
        caloriesBurned: finalCalories,
        date: date || format(new Date(), 'yyyy-MM-dd'),
        mood,
        notes: notes.trim(),
      };

      if (existing) {
        await api.patch(`/workouts/${existing._id}`, payload);
        toast.success('Workout updated!');
      } else {
        await api.post('/workouts', payload);
        toast.success(`⚡ Logged ${payload.title} (${finalCalories} kcal)!`);
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{existing ? 'Edit Workout' : 'Quick Workout Log'}</h2>
              <p className="text-xs text-gray-400">No manual math · Calories & metrics computed automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 1. Activity Type Visual Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
              Select Activity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map(t => {
                const Icon = t.icon;
                const active = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectType(t.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-sm shadow-emerald-500/20 text-white'
                        : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <Icon size={18} style={{ color: active ? 'var(--color-accent)' : t.color }} />
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Duration Selector with Quick Pills + Stepper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Duration
              </label>
              <span className="text-xs font-bold text-emerald-400">{duration} minutes</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleAdjustDuration(-5)}
                className="btn btn-secondary btn-sm px-3"
                title="Subtract 5 min"
              >
                -5m
              </button>
              <div className="flex-1 grid grid-cols-4 gap-1.5">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationPreset(mins)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      duration === mins
                        ? 'bg-emerald-500 text-black border-emerald-500 font-bold'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleAdjustDuration(5)}
                className="btn btn-secondary btn-sm px-3"
                title="Add 5 min"
              >
                +5m
              </button>
            </div>
          </div>

          {/* 3. Automatic Calorie Counter Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-400 shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-amber-400">{finalCalories} kcal</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Auto-Calculated
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Scientifically estimated based on activity and duration</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomCal(!isCustomCal)}
              className="text-[11px] text-gray-400 hover:text-white underline"
            >
              {isCustomCal ? 'Use Auto' : 'Edit'}
            </button>
          </div>

          {/* Optional custom calories field if toggled */}
          {isCustomCal && (
            <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800 flex items-center gap-3">
              <span className="text-xs text-gray-400">Custom kcal:</span>
              <input
                type="number"
                value={customCalories}
                onChange={e => setCustomCalories(e.target.value)}
                placeholder={String(autoCalories)}
                className="form-input text-xs py-1 px-2 w-24"
              />
            </div>
          )}

          {/* 4. Workout Name (Auto-filled, but easily tweakable) */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Workout Title
              </label>
              <button
                type="button"
                onClick={() => {
                  setTitleCustomized(false);
                  const match = WORKOUT_TYPES.find(t => t.id === type);
                  setTitle(match ? match.defaultTitle : 'Workout');
                }}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Reset Default
              </button>
            </div>
            <input
              className="form-input text-sm"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setTitleCustomized(true);
              }}
              placeholder="e.g. Morning Cardio"
            />
          </div>

          {/* 5. How did it feel? (One-tap Mood) */}
          <div>
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
              How did it feel?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                    mood === m.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold'
                      : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional notes & date toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAdvanced ? 'Hide date & notes' : '+ Add date & notes (optional)'}
            </button>

            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label text-xs">Date</label>
                    <input
                      type="date"
                      className="form-input text-xs"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label text-xs">Notes / PRs</label>
                  <textarea
                    className="form-input text-xs"
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Felt great, hit a new personal record..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : existing ? (
                'Save Changes'
              ) : (
                <>
                  <Zap size={15} /> Save Workout
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WorkoutsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWorkout, setEditWorkout] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [quickLoggingId, setQuickLoggingId] = useState(null);

  // Preset custom duration overrides
  const [presetDurations, setPresetDurations] = useState({
    p1: 45, p2: 30, p3: 20, p4: 25, p5: 35, p6: 30, p7: 30, p8: 30
  });

  // Smart natural prompt logger
  const [smartPrompt, setSmartPrompt] = useState('');
  const [parsingSmart, setParsingSmart] = useState(false);

  const userWeight = user?.weight || 70;

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const res = await api.get('/workouts', { params });
      setWorkouts(res.data.workouts || []);
    } catch {
      toast.error('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/${id}`);
      toast.success('Workout deleted');
      fetchWorkouts();
    } catch {
      toast.error('Failed to delete workout');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditWorkout(null);
    fetchWorkouts();
  };

  // Instant 1-Click Preset Logger (Zero modal, zero typing)
  const handleQuickLogPreset = async (preset) => {
    const dur = presetDurations[preset.id] || preset.defaultDuration;
    const calories = calculateBurn(preset.type, dur, userWeight);
    setQuickLoggingId(preset.id);
    try {
      await api.post('/workouts', {
        title: preset.title,
        type: preset.type,
        duration: dur,
        caloriesBurned: calories,
        date: format(new Date(), 'yyyy-MM-dd'),
        mood: 'great',
        notes: `Logged via 1-Click Quick Preset`,
      });
      toast.success(`⚡ Logged ${preset.title} (${dur}m · ${calories} kcal)!`);
      fetchWorkouts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log workout');
    } finally {
      setQuickLoggingId(null);
    }
  };

  // Instant 1-Click Re-log of a past workout
  const handleRepeatWorkout = async (w) => {
    try {
      await api.post('/workouts', {
        title: w.title,
        type: w.type || 'other',
        duration: w.duration || 30,
        caloriesBurned: w.caloriesBurned || 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        mood: w.mood || 'good',
        notes: w.notes ? `Repeated: ${w.notes}` : 'Repeated workout session',
      });
      toast.success(`⚡ Re-logged ${w.title}!`);
      fetchWorkouts();
    } catch {
      toast.error('Failed to re-log workout');
    }
  };

  // Smart Natural Language Parser (e.g. "Ran 5k in 25 min", "45 min chest workout")
  const handleSmartSubmit = async (textToParse) => {
    const raw = (textToParse || smartPrompt).trim();
    if (!raw) return;

    setParsingSmart(true);
    try {
      const lower = raw.toLowerCase();

      // Extract duration (e.g. "30 min", "45m", "25 minutes")
      let duration = 30;
      const durationMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes|m\b)/i);
      if (durationMatch) {
        duration = parseInt(durationMatch[1], 10);
      } else {
        const numMatch = lower.match(/\b(\d+)\b/);
        if (numMatch && parseInt(numMatch[1], 10) >= 5 && parseInt(numMatch[1], 10) <= 240) {
          duration = parseInt(numMatch[1], 10);
        }
      }

      // Extract type (prioritize specific high-intensity styles before general cardio)
      let type = 'other';
      if (/hiit|tabata|interval|circuit/i.test(lower)) {
        type = 'hiit';
      } else if (/yoga|stretch|pilates|mobility|flexibility/i.test(lower)) {
        type = 'flexibility';
      } else if (/strength|lift|chest|back|legs|push|pull|squat|bench|dumbbell|barbell|bicep|weights/i.test(lower)) {
        type = 'strength';
      } else if (/football|soccer|basketball|tennis|badminton|boxing|sports/i.test(lower)) {
        type = 'sports';
      } else if (/ran|run|running|jog|jogging|treadmill|walk|walking|cycle|cycling|bike|swim|swimming|elliptical|cardio|sprint/i.test(lower)) {
        type = 'cardio';
      }

      // Title capitalization
      let cleanTitle = raw.charAt(0).toUpperCase() + raw.slice(1);
      const calories = calculateBurn(type, duration, userWeight);

      await api.post('/workouts', {
        title: cleanTitle,
        type,
        duration,
        caloriesBurned: calories,
        date: format(new Date(), 'yyyy-MM-dd'),
        mood: /tired|exhausted/i.test(lower) ? 'tired' : /great|awesome|crushed/i.test(lower) ? 'great' : 'good',
        notes: `Smart Logged: "${raw}"`,
      });

      toast.success(`✨ Logged ${cleanTitle} (${duration}m · ${calories} kcal)!`);
      setSmartPrompt('');
      fetchWorkouts();
    } catch {
      toast.error('Failed to log workout');
    } finally {
      setParsingSmart(false);
    }
  };

  const typeConfig = useMemo(() => {
    const map = {};
    WORKOUT_TYPES.forEach(t => { map[t.id] = t; });
    return map;
  }, []);

  return (
    <div className="fade-in max-w-5xl mx-auto space-y-6">
      {/* ─── Top Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Workouts</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Effortless tracking · Log in 1 tap or auto-track with live AI camera
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct link to Hands-Free AI Studio */}
          <button
            onClick={() => navigate('/workout-studio')}
            className="btn btn-secondary border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
          >
            <Camera size={16} className="text-purple-400" />
            <span>AI Studio</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Live
            </span>
          </button>

          {/* Quick custom modal */}
          <button
            onClick={() => {
              setEditWorkout(null);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Quick Log
          </button>
        </div>
      </div>

      {/* ─── Hands-Free AI Camera Studio Highlight ───────────── */}
      <div className="card p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-gray-900/80 to-emerald-950/30 border-purple-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <Camera size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Zero Typing Needed: AI Camera Studio</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  Hands-Free
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 max-w-xl">
                Turn on your webcam or camera — FitLife automatically counts your reps, scores posture in real-time, calculates calorie burn, and logs workouts straight to your history!
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/workout-studio')}
            className="btn btn-primary bg-emerald-400 hover:bg-emerald-300 text-black font-bold shrink-0 text-xs px-4"
          >
            Launch AI Studio <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ─── Smart Natural Language / Voice One-Liner Logger ─── */}
      <div className="card p-4 bg-gray-900/60 border-gray-800">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles size={16} className="text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Smart One-Liner Logger
          </span>
          <span className="text-[11px] text-gray-400">· Just describe your session, we calculate the rest</span>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSmartSubmit();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={smartPrompt}
              onChange={e => setSmartPrompt(e.target.value)}
              placeholder="e.g. 'Ran 5k in 25 min' or '45 min heavy leg day'..."
              className="form-input text-xs sm:text-sm py-2 px-3 w-full bg-gray-950 border-gray-700 rounded-xl"
            />
          </div>
          <button
            type="submit"
            disabled={parsingSmart || !smartPrompt.trim()}
            className="btn btn-primary text-xs px-4 py-2 shrink-0"
          >
            {parsingSmart ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={14} /> Log Now
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <span className="text-[11px] text-gray-500">Quick ideas:</span>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSmartSubmit(p)}
              className="text-[11px] px-2 py-1 rounded-lg bg-gray-800/80 hover:bg-emerald-500/20 hover:text-emerald-300 border border-gray-700/60 text-gray-300 transition-colors"
            >
              + {p}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ⚡ One-Tap Quick Presets ─────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <h2 className="text-lg font-bold">1-Click Quick Presets</h2>
            <span className="text-xs text-gray-400 hidden sm:inline">· Tap to log instantly with zero typing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map(p => {
            const currentDur = presetDurations[p.id] || p.defaultDuration;
            const calories = calculateBurn(p.type, currentDur, userWeight);
            const isLogging = quickLoggingId === p.id;
            const config = typeConfig[p.type] || { color: '#9ca3af', label: p.type };

            return (
              <div
                key={p.id}
                className="card p-3.5 flex flex-col justify-between hover:border-emerald-500/40 transition-all bg-gray-900/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ background: `${config.color}20`, color: config.color }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{p.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>
                      <Clock size={11} className="inline mr-1 text-gray-400" />
                      {currentDur}m
                    </span>
                    <span className="text-amber-400 font-semibold">
                      <Flame size={11} className="inline mr-0.5" />
                      ~{calories} kcal
                    </span>
                  </div>
                </div>

                {/* Duration Pills + Instant Log Button */}
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {[15, 30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          setPresetDurations(prev => ({ ...prev, [p.id]: mins }))
                        }
                        className={`text-[10px] py-1 rounded font-semibold border transition-all ${
                          currentDur === mins
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isLogging}
                    onClick={() => handleQuickLogPreset(p)}
                    className="btn btn-primary w-full py-1.5 text-xs font-bold justify-center"
                  >
                    {isLogging ? (
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={13} /> 1-Tap Log
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Workout History Section ───────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-emerald-400" />
            <h2 className="text-lg font-bold">Workout History</h2>
            <span className="text-xs text-gray-400">({workouts.length})</span>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('')}
              className={`btn btn-xs px-2.5 py-1 ${!filterType ? 'btn-primary' : 'btn-secondary'}`}
            >
              All
            </button>
            {WORKOUT_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`btn btn-xs px-2.5 py-1 ${filterType === t.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : workouts.length === 0 ? (
          /* Empty state - Friendly, action-oriented */
          <div className="card p-8 text-center bg-gray-900/40 border-dashed border-gray-800">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-emerald-500/10 text-emerald-400">
              <Dumbbell size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No workouts logged yet</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
              Get started instantly! Click any preset above for 1-tap logging, use the AI Studio camera for zero manual input, or customize your session.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleQuickLogPreset(PRESETS[0])}
                className="btn btn-primary btn-sm text-xs"
              >
                <Zap size={14} /> Log 45m Strength Now
              </button>
              <button
                onClick={() => navigate('/workout-studio')}
                className="btn btn-secondary btn-sm text-xs border-purple-500/40 text-purple-300"
              >
                <Camera size={14} /> Open AI Studio
              </button>
            </div>
          </div>
        ) : (
          /* Workouts List */
          <div className="space-y-3">
            {workouts.map(w => {
              const config = typeConfig[w.type] || { color: '#9ca3af', label: w.type || 'other' };
              const Icon = config.icon || Dumbbell;

              return (
                <div key={w._id} className="card p-4 hover:border-gray-700 transition-all">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${config.color}20` }}
                    >
                      <Icon size={20} style={{ color: config.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-white truncate">{w.title}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ background: `${config.color}20`, color: config.color }}
                        >
                          {config.label}
                        </span>
                        {w.mood && (
                          <span className="text-[11px] text-gray-400 capitalize">
                            · {MOODS.find(m => m.id === w.mood)?.emoji} {w.mood}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs mt-1 text-gray-400">
                        <span>
                          <Clock size={12} className="inline mr-1 text-gray-500" />
                          {w.duration} min
                        </span>
                        {w.caloriesBurned > 0 && (
                          <span className="text-amber-400 font-medium">
                            <Flame size={12} className="inline mr-1" />
                            {w.caloriesBurned} kcal
                          </span>
                        )}
                        <span>
                          {w.date ? format(parseISO(w.date), 'MMM d, yyyy') : 'Recently'}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Re-log in 1-Click + Edit + Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleRepeatWorkout(w)}
                        title="Repeat this workout in 1 click"
                        className="btn btn-secondary btn-sm py-1 px-2.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1"
                      >
                        <RotateCcw size={13} />
                        <span className="hidden sm:inline">Repeat</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditWorkout(w);
                          setShowModal(true);
                        }}
                        className="btn btn-ghost btn-sm p-1.5 text-gray-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(w._id)}
                        className="btn btn-ghost btn-sm p-1.5 text-red-400 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>

                      {w.notes && (
                        <button
                          onClick={() => setExpandedId(expandedId === w._id ? null : w._id)}
                          className="btn btn-ghost btn-sm p-1.5 text-gray-400"
                        >
                          {expandedId === w._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded notes */}
                  {expandedId === w._id && w.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300">
                      <span className="font-semibold text-gray-400">Notes: </span>
                      {w.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Streamlined Quick Log Modal ───────────────────────── */}
      {(showModal || editWorkout) && (
        <UserFriendlyWorkoutModal
          onClose={() => {
            setShowModal(false);
            setEditWorkout(null);
          }}
          onSaved={handleSaved}
          existing={editWorkout}
          userWeight={userWeight}
        />
      )}
    </div>
  );
};

export default WorkoutsPage;
