import { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, X, Dumbbell, Sparkles } from 'lucide-react';
import api from '../../lib/api';

export const WorkoutSummaryModal = ({ data, exercise, onClose, user }) => {
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
        <div className="p-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Dumbbell size={18} style={{ color: '#10b981' }} />
            </div>
            <p className="text-2xl font-black">{data.totalReps}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Reps</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Clock size={18} style={{ color: '#3b82f6' }} />
            </div>
            <p className="text-2xl font-black">{formatDuration(data.activeDurationSeconds)}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Active Time</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Flame size={18} style={{ color: '#f59e0b' }} />
            </div>
            <p className="text-2xl font-black">{data.estimatedCalories}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>kcal est.</p>
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

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button className="btn btn-primary flex-1" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
