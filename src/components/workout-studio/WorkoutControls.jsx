import { Play, Pause, Square, RotateCcw, AlertTriangle } from 'lucide-react';

export const WorkoutControls = ({ session, onPause, onResume, onEnd, onRestart }) => {
  const handleEnd = () => {
    if (window.confirm('End this workout session? Your progress will be saved.')) {
      onEnd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {session === 'active' && (
          <button className="btn btn-secondary flex-1" onClick={onPause} aria-label="Pause workout">
            <Pause size={16} /> Pause
          </button>
        )}
        {session === 'paused' && (
          <button className="btn btn-primary flex-1" onClick={onResume} aria-label="Resume workout">
            <Play size={16} /> Resume
          </button>
        )}
        <button className="btn btn-danger flex-1" onClick={handleEnd} aria-label="End workout">
          <Square size={16} /> End Workout
        </button>
        <button className="btn btn-secondary" onClick={onRestart} aria-label="Restart workout" title="Restart">
          <RotateCcw size={16} />
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--color-text-subtle)' }}>
        <AlertTriangle size={11} className="inline mr-1" />
        Stop immediately if you feel pain, dizziness, or discomfort.
      </p>
    </div>
  );
};
