import { useState, useEffect } from 'react';
import {
  Calendar, Sparkles, CheckCircle2, Circle, Clock, Flame,
  Dumbbell, ChevronRight, RefreshCw, AlertCircle, Loader, Play, Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import VideoRecommendations from '../components/VideoRecommendations';
import { useAuth } from '../contexts/AuthContext';

export const WeeklyPlannerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [inspectExercise, setInspectExercise] = useState(null);

  // Generator form state
  const [showConfig, setShowConfig] = useState(false);
  const [formData, setFormData] = useState({
    goal: 'general_fitness',
    fitnessLevel: 'intermediate',
    daysPerWeek: 4,
    durationMinutes: 45,
    equipment: 'dumbbells',
    focusAreas: ['full_body'],
  });

  // Fetch current plan on mount
  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ai/weekly-plan/current');
      if (res.data?.plan) {
        setCurrentPlan(res.data.plan);
        setShowConfig(false);
        // default selected day to today or first day
        const todayDayIndex = new Date().getDay(); // 0 is Sunday
        const adjustedIndex = todayDayIndex === 0 ? 6 : todayDayIndex - 1; // 0=Mon, 6=Sun
        setSelectedDayIndex(Math.min(adjustedIndex, res.data.plan.days.length - 1));
      } else {
        setShowConfig(true);
      }
    } catch (err) {
      if (err.response?.data?.setupRequired) {
        setSetupRequired(true);
      } else if (err.response?.status !== 404) {
        console.error('Error fetching plan:', err);
      }
      setShowConfig(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        userWeight: Number(user?.weight) || 70,
        userHeight: Number(user?.height) || 175,
        userAge: Number(user?.age) || 25,
        gender: user?.gender || 'male',
      };
      const res = await api.post('/ai/weekly-plan', payload);
      setCurrentPlan(res.data.plan);
      setShowConfig(false);
      setSelectedDayIndex(0);
      toast.success('Your AI weekly workout plan is ready!');
    } catch (err) {
      console.error('Generation error:', err);
      if (err.response?.data?.setupRequired) {
        setSetupRequired(true);
      } else {
        setError(err.response?.data?.error || 'Failed to generate weekly plan. Please check your settings and try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const toggleDayCompleted = async (dayIndex) => {
    if (!currentPlan) return;
    const targetDay = currentPlan.days[dayIndex];
    const newStatus = targetDay.completed ? false : true;

    try {
      const res = await api.patch(`/ai/weekly-plan/${currentPlan._id || 'mock-id'}/day/${dayIndex}`, {
        completed: newStatus,
      });

      // Update local state
      const updatedDays = [...currentPlan.days];
      updatedDays[dayIndex] = { ...updatedDays[dayIndex], completed: newStatus };
      setCurrentPlan({ ...currentPlan, days: updatedDays });

      toast.success(newStatus ? `Day ${dayIndex + 1} marked as completed! 🎉` : `Day ${dayIndex + 1} marked incomplete`);
    } catch (err) {
      console.error('Status update error:', err);
      // Optimistic fallback for mock/offline
      const updatedDays = [...currentPlan.days];
      updatedDays[dayIndex] = { ...updatedDays[dayIndex], completed: newStatus };
      setCurrentPlan({ ...currentPlan, days: updatedDays });
    }
  };

  const calculateProgress = () => {
    if (!currentPlan?.days?.length) return 0;
    const completed = currentPlan.days.filter((d) => d.completed).length;
    return Math.round((completed / currentPlan.days.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader size={32} className="animate-spin text-emerald-400 mb-3" />
        <p className="text-sm text-gray-400">Loading your workout schedule...</p>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Calendar size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              AI Weekly Workout Planner
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini 2.5
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Personalized weekly training split tailored to your goals, equipment, and level
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentPlan && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              {showConfig ? 'View Active Plan' : 'Customize / Regenerate'}
            </button>
          )}
          <button
            onClick={() => navigate('/workout-studio')}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Play size={14} /> Open AI Studio
          </button>
        </div>
      </div>

      {/* Setup Required Warning */}
      {setupRequired && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Gemini API Key Required on Server</p>
            <p className="text-xs text-gray-400 mt-1">
              Add <code className="bg-gray-800 px-1 py-0.5 rounded text-amber-300">GEMINI_API_KEY</code> to your backend environment to enable dynamic AI plan generation. Using built-in intelligent smart routines for now.
            </p>
          </div>
        </div>
      )}

      {/* Generator Form Modal / Panel */}
      {showConfig && (
        <div className="card border-purple-500/30 bg-gray-900/90 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <h2 className="text-base font-bold text-white">Generate Your Weekly Routine</h2>
            </div>
            {currentPlan && (
              <button
                onClick={() => setShowConfig(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Primary Fitness Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="form-input text-xs w-full"
              >
                <option value="general_fitness">General Health & Fitness</option>
                <option value="weight_loss">Weight Loss & Fat Burning</option>
                <option value="muscle_hypertrophy">Muscle Building & Hypertrophy</option>
                <option value="strength">Strength & Power</option>
                <option value="endurance">Cardio & Stamina</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Experience Level</label>
              <select
                value={formData.fitnessLevel}
                onChange={(e) => setFormData({ ...formData, fitnessLevel: e.target.value })}
                className="form-input text-xs w-full"
              >
                <option value="beginner">Beginner (0-6 months)</option>
                <option value="intermediate">Intermediate (6-24 months)</option>
                <option value="advanced">Advanced (2+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Days Per Week</label>
              <select
                value={formData.daysPerWeek}
                onChange={(e) => setFormData({ ...formData, daysPerWeek: Number(e.target.value) })}
                className="form-input text-xs w-full"
              >
                <option value={3}>3 Days (Full Body Split)</option>
                <option value={4}>4 Days (Upper / Lower Split)</option>
                <option value={5}>5 Days (Push / Pull / Legs)</option>
                <option value={6}>6 Days (Intense Split)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Equipment Access</label>
              <select
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                className="form-input text-xs w-full"
              >
                <option value="bodyweight_only">Bodyweight Only (No Equipment)</option>
                <option value="dumbbells">Dumbbells / Home Gym</option>
                <option value="full_gym">Full Commercial Gym</option>
                <option value="resistance_bands">Resistance Bands</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-800">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-400 shrink-0" />
                Calibrating volume for: <strong className="text-white">{user?.weight || 70} kg</strong> · <strong className="text-white">{user?.height || 175} cm</strong> · <strong className="text-emerald-400">{formData.fitnessLevel}</strong>
              </span>
              <button
                type="submit"
                disabled={generating}
                className="btn btn-primary text-xs flex items-center gap-2 px-5 py-2.5"
              >
                {generating ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Synthesizing Routine with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate Weekly Routine
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Active Routine View */}
      {currentPlan && (
        <div className="space-y-6">
          {/* Plan Summary Bar */}
          <div className="card p-5 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-850 border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {currentPlan.title || 'Custom 7-Day Protocol'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  {currentPlan.fitnessLevel || 'All Levels'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {currentPlan.description || 'Targeted training program designed for progressive muscular endurance and strength.'}
              </p>
            </div>

            {/* Adherence Progress Bar */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-xs text-gray-400">Weekly Adherence</span>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {calculateProgress()}%
                </p>
              </div>
              <div className="w-28 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7-Day Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {currentPlan.days?.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              const isRest = day.isRestDay || day.focus?.toLowerCase().includes('rest');
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-950/50'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Day {idx + 1}
                    </span>
                    {day.completed ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <Circle size={14} className="text-gray-600" />
                    )}
                  </div>

                  <div className="my-2">
                    <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-purple-300' : 'text-gray-200'}`}>
                      {day.focus || (isRest ? 'Rest & Recover' : `Workout ${idx + 1}`)}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {isRest ? 'Active Recovery' : `${day.exercises?.length || 0} exercises`}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="h-0.5 w-full bg-purple-500 rounded-full mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailed View of Selected Day */}
          {currentPlan.days?.[selectedDayIndex] && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Workout Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-5 bg-gray-900/70 border-gray-800">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Day {selectedDayIndex + 1}: {currentPlan.days[selectedDayIndex].focus}
                        </h3>
                        {currentPlan.days[selectedDayIndex].isRestDay && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Rest Day
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Estimated Duration: <span className="text-gray-200">{currentPlan.days[selectedDayIndex].duration || '40-45 mins'}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => toggleDayCompleted(selectedDayIndex)}
                      className={`btn btn-sm flex items-center gap-1.5 ${
                        currentPlan.days[selectedDayIndex].completed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'btn-secondary text-xs'
                      }`}
                    >
                      {currentPlan.days[selectedDayIndex].completed ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-400" /> Completed
                        </>
                      ) : (
                        <>
                          <Circle size={14} /> Mark Day as Done
                        </>
                      )}
                    </button>
                  </div>

                  {/* Warmup notice */}
                  {currentPlan.days[selectedDayIndex].warmup && (
                    <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs">
                      <strong className="text-orange-400 flex items-center gap-1 mb-1">
                        <Flame size={12} /> Warm-up (5-8 mins):
                      </strong>
                      <span className="text-gray-300">{currentPlan.days[selectedDayIndex].warmup}</span>
                    </div>
                  )}

                  {/* Exercise list */}
                  <div className="mt-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Exercise Circuit & Sets
                    </h4>

                    {(!currentPlan.days[selectedDayIndex].exercises || currentPlan.days[selectedDayIndex].exercises.length === 0) ? (
                      <div className="p-6 text-center text-xs text-gray-500 bg-gray-950/40 rounded-xl">
                        Rest and recovery day. Hydrate, stretch, get 8 hours of sleep, and take a 20-minute light walk!
                      </div>
                    ) : (
                      currentPlan.days[selectedDayIndex].exercises.map((item, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-3.5 bg-gray-950/50 hover:bg-gray-950/80 border border-gray-800/80 hover:border-gray-700 rounded-xl transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-800 text-[11px] font-mono text-gray-400 flex items-center justify-center shrink-0">
                              {exIdx + 1}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-gray-200">
                                {item.name}
                              </h5>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                <span className="text-emerald-400 font-semibold">{item.sets || 3} sets</span> × {item.reps || '10-12 reps'}
                                {item.rest && <span className="text-gray-500 ml-2">({item.rest} rest)</span>}
                              </p>
                              {item.tips && (
                                <p className="text-[10px] text-gray-500 mt-0.5 italic">
                                  💡 {item.tips}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setInspectExercise(item.name)}
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                              title="Watch Video Tutorial"
                            >
                              <Video size={13} className="text-red-400" />
                              <span className="hidden sm:inline text-[11px]">Video</span>
                            </button>
                            <button
                              onClick={() => navigate('/workout-studio')}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1 border border-emerald-500/20 transition-colors"
                              title="Start with AI Camera"
                            >
                              <Play size={13} />
                              <span className="hidden sm:inline text-[11px]">Track</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cooldown */}
                  {currentPlan.days[selectedDayIndex].cooldown && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                      <strong className="text-blue-400 flex items-center gap-1 mb-1">
                        <Clock size={12} /> Cool-down:
                      </strong>
                      <span className="text-gray-300">{currentPlan.days[selectedDayIndex].cooldown}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Video Recommendations for Selected Exercise */}
              <div className="space-y-4">
                <div className="card p-5 bg-gray-900/70 border-gray-800">
                  <VideoRecommendations
                    exerciseName={
                      inspectExercise ||
                      currentPlan.days[selectedDayIndex].exercises?.[0]?.name ||
                      'squats'
                    }
                    compact={true}
                  />
                </div>

                {/* Coaching Guidance */}
                <div className="card p-4 bg-purple-950/20 border-purple-900/40 text-xs text-gray-300 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Sparkles size={14} />
                    <span>Coach Tips for Today</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-400">
                    Focus on clean form and consistent eccentric control over heavy weights. Remember to drink 500ml water 30 minutes before training.
                  </p>
                  <button
                    onClick={() => navigate('/ai-coach')}
                    className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Ask AI Coach for adjustments</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyPlannerPage;
