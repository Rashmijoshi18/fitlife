import { WorkoutStudio } from '../components/workout-studio/WorkoutStudio';
import { Zap } from 'lucide-react';

const WorkoutStudioPage = () => (
  <div className="fade-in max-w-5xl mx-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--color-accent-dim)' }}>
        <Zap size={20} style={{ color: 'var(--color-accent)' }} />
      </div>
      <div>
        <h1 className="text-3xl font-black">AI Workout Studio</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Real-time pose detection, rep counting & form feedback
        </p>
      </div>
    </div>

    <WorkoutStudio />
  </div>
);

export default WorkoutStudioPage;
