import { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, X, Dumbbell, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export const WorkoutSummaryModal = ({ data, exercise, onClose, user }) => {
  const navigate = useNavigate();
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    // Fetch AI summary if backend is available
    const fetchSummary = async () => {
      setLoadingAI(true);
      try {
        const res = await api.post('/ai/session-summary', {
          exerciseName: data.exerciseName,
          activeDurationMinutes: data.activeDurationMinutes,
          totalReps: data.totalReps,
          avgFormQuality: data.formQuality,
          estimatedCalories: data.estimatedCalories,
        });
        setAiSummary(res.data.summary);
      } catch {
        setAiSummary(null);
      } finally {
        setLoadingAI(false);
      }
    };
    fetchSummary();
  }, [data]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-accent-dim)' }}>
                <Trophy size={20} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Workout Complete!</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{data.exerciseName}</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Dumbbell size={16} style={{ color: '#10b981' }} />
            </div>
            <p className="text-xl font-black">{data.totalReps}</p>
            <p className="text-[11px] text-gray-400">Total Reps</p>
          </div>

          <div className="text-center p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
              style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Dumbbell size={16} style={{ color: '#8b5cf6' }} />
            </div>
            <p className="text-xl font-black text-purple-300">
              {data.dumbbellWeightKg > 0 ? `${data.dumbbellWeightKg} kg` : '0 kg'}
            </p>
            <p className="text-[11px] text-gray-400">
              {data.dumbbellWeightKg > 0 ? 'Dumbbells' : 'Bodyweight'}
            </p>
          </div>

          <div className="text-center p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Clock size={16} style={{ color: '#3b82f6' }} />
            </div>
            <p className="text-xl font-black">{formatDuration(data.activeDurationSeconds)}</p>
            <p className="text-[11px] text-gray-400">Active Time</p>
          </div>

          <div className="text-center p-3 rounded-xl bg-gray-900/60 border border-gray-800">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Flame size={16} style={{ color: '#f59e0b' }} />
            </div>
            <p className="text-xl font-black text-amber-400">{data.estimatedCalories}</p>
            <p className="text-[11px] text-gray-400">kcal burned</p>
          </div>
        </div>

        {/* Form status */}
        <div className="px-6 mb-4">
          <div className="p-3 rounded-lg text-center"
            style={{ background: 'var(--color-surface-2)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Avg. Form: <span style={{ color: 'var(--color-text)' }}>{data.formQuality}</span>
            </p>
          </div>
        </div>

        {/* Calorie disclaimer */}
        <div className="px-6 mb-4">
          <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
            * Calorie estimate based on MET method. Actual expenditure varies with intensity, rest periods, and individual physiology.
          </p>
        </div>

        {/* AI Coach Summary */}
        {(loadingAI || aiSummary) && (
          <div className="px-6 mb-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} style={{ color: '#8b5cf6' }} />
                <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>AI Coach Note</span>
              </div>
              {loadingAI ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#8b5cf6' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Generating summary…</span>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{aiSummary}</p>
              )}
            </div>
          </div>
        )}

        {/* Saved confirmation badge */}
        {data.saved && (
          <div className="px-6 mb-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Workout automatically saved to your history!</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            className="btn btn-secondary flex-1 text-xs"
            onClick={() => {
              onClose();
              navigate('/workouts');
            }}
          >
            View in Workouts
          </button>
          <button className="btn btn-primary flex-1 text-xs" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
