export const RepCounter = ({ repCount, phase, exerciseName }) => (
  <div className="card text-center" style={{ padding: '1rem' }}>
    <p
      className="text-4xl font-black"
      style={{ color: 'var(--color-accent)', fontFamily: 'Space Grotesk, sans-serif' }}
      aria-label={`${repCount} repetitions`}
    >
      {repCount}
    </p>
    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
      Reps
    </p>
    <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
      {phase}
    </p>
  </div>
);
