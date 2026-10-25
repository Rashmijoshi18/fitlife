export const RepCounter = ({ repCount, phase, exerciseName }) => {
  const isCurledOrBottom = ['curled', 'bottom', 'open'].includes(phase?.toLowerCase());

  return (
    <div className="card text-center transition-all duration-200" style={{ padding: '1rem' }}>
      <p
        className="text-4xl font-black transition-transform duration-150"
        style={{
          color: isCurledOrBottom ? '#10b981' : 'var(--color-accent)',
          fontFamily: 'Space Grotesk, sans-serif',
          transform: isCurledOrBottom ? 'scale(1.08)' : 'scale(1)'
        }}
        aria-label={`${repCount} repetitions`}
      >
        {repCount}
      </p>
      <p className="text-xs font-bold mt-1" style={{ color: 'var(--color-text-muted)' }}>
        Reps
      </p>
      <div className="mt-1">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
            isCurledOrBottom
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
              : 'bg-gray-800/80 text-gray-400'
          }`}
        >
          {phase || 'Ready'}
        </span>
      </div>
    </div>
  );
};
