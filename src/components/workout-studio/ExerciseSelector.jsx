import { useState } from 'react';
import {
  Camera,
  Dumbbell,
  ChevronRight,
  Info,
  ArrowLeft,
  Play,
  Plus,
  Minus,
  Sparkles,
  Footprints,
  ShieldCheck,
  ArrowUpCircle,
  MoveHorizontal,
  Target,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { getCaloriesPerRep } from '../../lib/calorieEstimator';

export const EXERCISE_CONFIG = {
  squats: {
    icon: Footprints,
    color: '#10b981', // Emerald
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    tag: 'Legs & Glutes',
  },
  pushups: {
    icon: ShieldCheck,
    color: '#3b82f6', // Blue
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)',
    tag: 'Chest & Core',
  },
  bicep_curls: {
    icon: Dumbbell,
    color: '#a855f7', // Purple
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.25)',
    tag: 'Arms & Biceps',
  },
  shoulder_press: {
    icon: ArrowUpCircle,
    color: '#f59e0b', // Amber
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    tag: 'Deltoids & Shoulders',
  },
  lateral_raises: {
    icon: MoveHorizontal,
    color: '#ec4899', // Pink
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.25)',
    tag: 'Side Delts',
  },
  lunges: {
    icon: Target,
    color: '#06b6d4', // Cyan
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.25)',
    tag: 'Quads & Balance',
  },
  jumping_jacks: {
    icon: Zap,
    color: '#eab308', // Yellow
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.25)',
    tag: 'Cardio & Agility',
  },
  high_knees: {
    icon: Activity,
    color: '#f97316', // Orange
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.25)',
    tag: 'HIIT & Core',
  },
  glute_bridge: {
    icon: Layers,
    color: '#14b8a6', // Teal
    bg: 'rgba(20, 184, 166, 0.12)',
    border: 'rgba(20, 184, 166, 0.25)',
    tag: 'Glutes & Posterior',
  },
};

const renderExerciseIcon = (exerciseId, size = 22, containerClass = "w-12 h-12 rounded-xl") => {
  const config = EXERCISE_CONFIG[exerciseId] || {
    icon: Activity,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  };
  const IconComponent = config.icon;
  return (
    <div
      className={`${containerClass} flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <IconComponent size={size} style={{ color: config.color }} strokeWidth={2.2} />
    </div>
  );
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

const DUMBBELL_PRESETS = [0, 2, 4, 5, 7.5, 10, 12.5, 15, 20];

export const ExerciseSelector = ({ exercises, onSelect, userWeight = 70 }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [dumbbellWeight, setDumbbellWeight] = useState(5); // default 5kg

  const handleExerciseClick = (exercise) => {
    // Bodyweight exercises default to 0kg; weighted upper/lower body default to 5kg
    const bodyweightOnly = ['pushups', 'jumping_jacks', 'high_knees', 'glute_bridge'].includes(exercise.id);
    const defaultWeight = bodyweightOnly ? 0 : 5;
    setDumbbellWeight(defaultWeight);
    setSelectedExercise(exercise);
  };

  const handleStartWorkout = () => {
    if (!selectedExercise) return;
    onSelect(selectedExercise, Number(dumbbellWeight) || 0);
  };

  // ─── Step 2: Configure Dumbbell Weight ───────────────────────────────────────
  if (selectedExercise) {
    const isWeighted = Number(dumbbellWeight) > 0;
    const totalExternalLoad = (Number(dumbbellWeight) || 0) * 2;
    const estKcalPerRep = getCaloriesPerRep(
      selectedExercise.id,
      Number(dumbbellWeight) || 0,
      userWeight
    );

    return (
      <div className="fade-in max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedExercise(null)}
          className="btn btn-ghost btn-sm flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Exercises
        </button>

        {/* Selected Exercise Banner */}
        <div className="card p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-gray-900 to-gray-900">
          <div className="flex items-center gap-4">
            {renderExerciseIcon(selectedExercise.id, 28, 'w-14 h-14 rounded-2xl')}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Step 2 of 2: Setup Dumbbells
              </span>
              <h2 className="text-2xl font-black text-white mt-1">{selectedExercise.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{selectedExercise.cameraGuidance}</p>
            </div>
          </div>
        </div>

        {/* Dumbbell Selection Card */}
        <div className="card p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell size={18} className="text-emerald-400" />
                <h3 className="font-bold text-base text-white">Select Dumbbell Weight</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                {isWeighted ? `${dumbbellWeight} kg per dumbbell` : 'Bodyweight Only (0 kg)'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select the weight of the dumbbells you are using. This accurately computes your energy expenditure and workload.
            </p>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Preset Weights (per dumbbell):</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {DUMBBELL_PRESETS.map((kg) => {
                const active = Number(dumbbellWeight) === kg;
                return (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setDumbbellWeight(kg)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold shadow-lg shadow-emerald-950/50'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                    <p className="text-base font-black">{kg === 0 ? '0 kg' : `${kg} kg`}</p>
                    <p className="text-[10px] opacity-75">{kg === 0 ? 'Bodyweight' : `${kg * 2}kg pair`}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Weight Stepper */}
          <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800">
            <p className="text-xs font-semibold text-gray-400 mb-2">Or Enter Custom Weight (kg):</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDumbbellWeight((prev) => Math.max(0, Math.round((Number(prev) - 0.5) * 10) / 10))}
                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition"
                aria-label="Decrease weight"
              >
                <Minus size={16} />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={dumbbellWeight}
                  onChange={(e) => setDumbbellWeight(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="form-input text-center text-xl font-black text-emerald-400 w-full"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  kg / dumbbell
                </span>
              </div>

              <button
                type="button"
                onClick={() => setDumbbellWeight((prev) => Math.min(100, Math.round((Number(prev) + 0.5) * 10) / 10))}
                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition"
                aria-label="Increase weight"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Load & Calorie Calculation Insight */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center justify-between text-purple-300">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400 shrink-0" />
              <span>
                {isWeighted ? (
                  <>
                    Total load: <strong>{totalExternalLoad} kg</strong> (pair) · Calorie rate: ~<strong>{estKcalPerRep.toFixed(2)} kcal</strong> / rep
                  </>
                ) : (
                  <>
                    Bodyweight resistance only · Calorie rate: ~<strong>{estKcalPerRep.toFixed(2)} kcal</strong> / rep
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedExercise(null)}
            className="btn btn-secondary flex-1"
          >
            Change Exercise
          </button>
          <button
            type="button"
            onClick={handleStartWorkout}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 py-3"
          >
            <Play size={16} /> Start AI Workout ({isWeighted ? `${dumbbellWeight} kg` : 'Bodyweight'})
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 1: Choose Exercise ────────────────────────────────────────────────
  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--color-accent-dim)' }}>
          <Camera size={32} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h2 className="text-2xl font-black">Choose Your Exercise</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Select an exercise below. You will be prompted to select your dumbbell weight before starting.
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Info size={16} className="shrink-0 mt-0.5" style={{ color: '#3b82f6' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          AI counts reps in real-time using pose landmark detection. Calorie expenditure accounts for bodyweight,
          selected dumbbell weight, and active movement.
        </p>
      </div>

      {/* Exercise grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => {
          const config = EXERCISE_CONFIG[exercise.id];
          return (
            <button
              key={exercise.id}
              onClick={() => handleExerciseClick(exercise)}
              className="card text-left hover:border-emerald-500/80 transition-all group relative overflow-hidden"
              style={{ padding: '1.25rem', cursor: 'pointer' }}
            >
              <div className="flex items-start justify-between mb-3">
                {renderExerciseIcon(exercise.id, 22, 'w-12 h-12 rounded-xl')}
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Setup & Start</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1">{exercise.name}</h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="badge" style={{
                  background: `${difficultyColors.beginner}20`,
                  color: difficultyColors.beginner,
                }}>
                  {difficultyLabel.beginner}
                </span>
                {config?.tag && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                  >
                    {config.tag}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Camera size={13} className="shrink-0 mt-0.5 text-gray-400" />
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
          );
        })}
      </div>
    </div>
  );
};
