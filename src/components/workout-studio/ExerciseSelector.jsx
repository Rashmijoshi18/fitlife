import { Camera, Dumbbell, ChevronRight, Info } from 'lucide-react';

const muscleIcons = {
  squats: '🦵',
  pushups: '💪',
  bicep_curls: '🏋️',
  jumping_jacks: '⭐',
  lunges: '🦵',
};

const difficultyColors = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

const difficultyLabel = {
  beginner: 'Beginner Friendly',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const ExerciseSelector = ({ exercises, onSelect }) => {
  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--color-accent-dim)' }}>
          <Camera size={32} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h2 className="text-2xl font-black">Choose Your Exercise</h2>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Select an exercise to begin AI-tracked workout. Camera will activate after you choose.
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Info size={16} className="shrink-0 mt-0.5" style={{ color: '#3b82f6' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Rep counting uses MediaPipe pose detection and may not be 100% accurate. Results depend on camera angle,
          lighting, and body visibility. This is fitness guidance, not a medical tool.
        </p>
      </div>

      {/* Exercise grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="card text-left hover:border-emerald-500 transition-all group"
            style={{ padding: '1.25rem', cursor: 'pointer' }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{muscleIcons[exercise.id] || '🏃'}</span>
              <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-accent)' }} />
            </div>

            <h3 className="font-bold text-lg mb-1">{exercise.name}</h3>

            <div className="flex items-center gap-2 mb-3">
              <span className="badge" style={{
                background: `${difficultyColors.beginner}20`,
                color: difficultyColors.beginner,
              }}>
                {difficultyLabel.beginner}
              </span>
            </div>

            <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Dumbbell size={12} className="shrink-0 mt-0.5" />
              <span>{exercise.cameraGuidance}</span>
            </div>

            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-subtle)' }}>
                Tracked phases:
              </p>
              <div className="flex flex-wrap gap-1">
                {exercise.phases.map((phase) => (
                  <span key={phase} className="badge badge-gray capitalize" style={{ fontSize: '0.65rem' }}>
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
