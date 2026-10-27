import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Apple,
  Trash2,
  Edit2,
  X,
  Flame,
  Sparkles,
  Dumbbell,
  Droplets,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { calculatePlanNutritionTargets } from '../lib/nutritionAdvisor';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
const mealTypeColors = {
  breakfast: '#f59e0b',
  lunch: '#10b981',
  dinner: '#3b82f6',
  snack: '#8b5cf6',
  pre_workout: '#ef4444',
  post_workout: '#06b6d4',
};

const MealModal = ({ onClose, onSaved, existing, initialData }) => {
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name,
          mealType: existing.mealType,
          date: format(parseISO(existing.date), 'yyyy-MM-dd'),
          servingSize: existing.servingSize,
          servingUnit: existing.servingUnit,
          calories: existing.calories,
          protein: existing.protein || 0,
          carbs: existing.carbs || 0,
          fat: existing.fat || 0,
          notes: existing.notes || '',
        }
      : {
          name: initialData?.name || '',
          mealType: initialData?.mealType || 'breakfast',
          date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
          servingSize: 1,
          servingUnit: 'serving',
          calories: initialData?.calories || '',
          protein: initialData?.protein || 0,
          carbs: initialData?.carbs || 0,
          fat: initialData?.fat || 0,
          notes: initialData?.notes || '',
        }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Meal name is required';
    if (!form.calories && form.calories !== 0) e.calories = 'Calories are required';
    else if (Number(form.calories) < 0) e.calories = 'Cannot be negative';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      if (existing) {
        await api.patch(`/meals/${existing._id}`, form);
        toast.success('Meal updated!');
      } else {
        await api.post('/meals', form);
        toast.success('Meal logged!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-xl font-bold">{existing ? 'Edit Meal' : 'Log Meal'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: 'var(--color-text-muted)',
            }}
          >
            ℹ️ Nutritional values are estimates tracked for your fitness journey.
          </div>

          <div className="form-group">
            <label className="form-label">Food/Meal Name *</label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Oatmeal with banana"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Meal Type</label>
              <select
                className="form-input form-select"
                value={form.mealType}
                onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value }))}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Serving Size</label>
              <input
                type="number"
                className="form-input"
                value={form.servingSize}
                onChange={(e) => setForm((p) => ({ ...p, servingSize: e.target.value }))}
                placeholder="1"
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Serving Unit</label>
              <input
                className="form-input"
                value={form.servingUnit}
                onChange={(e) => setForm((p) => ({ ...p, servingUnit: e.target.value }))}
                placeholder="serving / cup / g"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="form-group">
              <label className="form-label">Calories (kcal) *</label>
              <input
                type="number"
                className={`form-input ${errors.calories ? 'error' : ''}`}
                value={form.calories}
                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                placeholder="0"
                min="0"
              />
              {errors.calories && <span className="form-error">{errors.calories}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Protein (g)</label>
              <input
                type="number"
                className="form-input"
                value={form.protein}
                onChange={(e) => setForm((p) => ({ ...p, protein: Number(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Carbs (g)</label>
              <input
                type="number"
                className="form-input"
                value={form.carbs}
                onChange={(e) => setForm((p) => ({ ...p, carbs: Number(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input
                type="number"
                className="form-input"
                value={form.fat}
                onChange={(e) => setForm((p) => ({ ...p, fat: Number(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : existing ? 'Update Meal' : 'Log Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NutritionPage = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [dayWorkouts, setDayWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Hydration state stored locally per day
  const [waterLoggedMl, setWaterLoggedMl] = useState(() => {
    const saved = localStorage.getItem(`fitlife_water_${selectedDate}`);
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    const saved = localStorage.getItem(`fitlife_water_${selectedDate}`);
    setWaterLoggedMl(saved ? Number(saved) : 0);
  }, [selectedDate]);

  const addWater = (ml) => {
    setWaterLoggedMl((prev) => {
      const next = Math.max(0, prev + ml);
      localStorage.setItem(`fitlife_water_${selectedDate}`, String(next));
      toast.success(`Logged +${ml}ml water! 💧`, { duration: 1500 });
      return next;
    });
  };

  const fetchDayData = useCallback(async () => {
    setLoading(true);
    try {
      const [mealsRes, planRes, workoutsRes] = await Promise.all([
        api.get('/meals', { params: { date: selectedDate } }),
        api.get('/ai/weekly-plan/current').catch(() => ({ data: { plan: null } })),
        api.get('/workouts', { params: { limit: 50 } }).catch(() => ({ data: { workouts: [] } })),
      ]);

      setMeals(mealsRes.data.meals || []);
      setWeeklyPlan(planRes.data?.plan || null);

      // Filter workouts on the selected date
      const matchedWorkouts = (workoutsRes.data?.workouts || []).filter((w) => {
        const d = (w.date || w.createdAt || '').slice(0, 10);
        return d === selectedDate;
      });
      setDayWorkouts(matchedWorkouts);
    } catch {
      toast.error('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Meal deleted');
      fetchDayData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditMeal(null);
    setModalInitialData(null);
    fetchDayData();
  };

  // ─── Calculate Dynamically Adjusted Nutrition Targets ───────────────────────
  const advisor = calculatePlanNutritionTargets({
    user,
    plan: weeklyPlan,
    dateStr: selectedDate,
    dayWorkouts,
  });

  const { targets } = advisor;

  // Daily totals
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const caloriesRemaining = targets.calories - Math.round(totals.calories);
  const isOverCalorie = caloriesRemaining < 0;

  const macroData = [
    { name: 'Protein', value: Math.round(totals.protein), color: '#10b981' },
    { name: 'Carbs', value: Math.round(totals.carbs), color: '#3b82f6' },
    { name: 'Fat', value: Math.round(totals.fat), color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  // Group by meal type
  const grouped = MEAL_TYPES.reduce((acc, t) => {
    const type_meals = meals.filter((m) => m.mealType === t);
    if (type_meals.length > 0) acc[t] = type_meals;
    return acc;
  }, {});

  const handleQuickLogSuggestion = (suggestion) => {
    setModalInitialData({
      name: suggestion.name,
      mealType: suggestion.mealType,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
      date: selectedDate,
    });
    setShowModal(true);
  };

  return (
    <div className="fade-in max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Nutrition</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Calorie and macro targets automatically synchronized with your AI workout plan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setModalInitialData(null);
              setEditMeal(null);
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <Plus size={16} /> Log Meal
          </button>
        </div>
      </div>

      {/* Date Picker Bar */}
      <div className="flex items-center gap-4">
        <input
          type="date"
          className="form-input"
          style={{ width: 'auto' }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button
          onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
          className="btn btn-secondary btn-sm"
        >
          Today
        </button>
      </div>

      {/* ─── AI Workout Plan Nutrition Sync Banner ─────────────────────────── */}
      <div className="card p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-gray-900 to-gray-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles size={12} /> AI Workout Plan Synchronized
              </span>
              {advisor.isWorkoutDay ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  🔥 Active Training Day
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  🌱 Rest & Recovery Day
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white">
              {advisor.isWorkoutDay
                ? `Today's Plan: ${advisor.focus}`
                : 'Rest Day: Muscle Recovery & Tissue Repair'}
            </h2>

            <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
              {advisor.isWorkoutDay ? (
                <>
                  Expenditure boosted by ~<strong>{advisor.effectiveWorkoutBurn} kcal</strong>. Carbohydrates set to{' '}
                  <strong className="text-blue-400">{targets.carbs}g</strong> to fuel muscle glycogen, with protein elevated to{' '}
                  <strong className="text-emerald-400">{targets.protein}g</strong> for optimal muscle protein synthesis.
                </>
              ) : (
                <>
                  Caloric baseline calibrated to maintenance (<strong>{targets.calories} kcal</strong>). Carbohydrates moderated to{' '}
                  <strong className="text-blue-400">{targets.carbs}g</strong> while sustaining{' '}
                  <strong className="text-emerald-400">{targets.protein}g</strong> protein to protect muscle mass during recovery.
                </>
              )}
            </p>

            {/* Biometric Baseline Footnote */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-emerald-500/20 text-xs">
              <span className="text-gray-400 font-semibold">Your Biometrics:</span>
              <span className="font-bold text-white bg-gray-950/70 px-2 py-0.5 rounded border border-gray-800">
                {user?.weight || 70} kg
              </span>
              <span className="font-bold text-white bg-gray-950/70 px-2 py-0.5 rounded border border-gray-800">
                {user?.height || 175} cm
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                BMR: {Math.round(10 * (Number(user?.weight) || 70) + 6.25 * (Number(user?.height) || 175) - 5 * (Number(user?.age) || 25) + (user?.gender === 'female' ? -161 : 5))} kcal
              </span>
              <Link to="/profile" className="ml-auto text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                Edit Height & Weight <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <div className="shrink-0 flex md:flex-col gap-2">
            <Link
              to="/weekly-planner"
              className="btn btn-secondary btn-sm flex items-center gap-1 text-xs"
            >
              <Calendar size={13} /> View AI Routine
            </Link>
            <Link
              to="/workout-studio"
              className="btn btn-primary btn-sm flex items-center gap-1 text-xs shadow-md shadow-emerald-950/40"
            >
              <Dumbbell size={13} /> Start AI Workout
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Macro & Calorie Targets vs Actuals ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Calories Card */}
        <div className="card p-4 space-y-2 border-emerald-500/20 bg-gray-900/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold flex items-center gap-1">
              <Flame size={14} className="text-orange-400" /> Calories
            </span>
            <span className={`text-[11px] font-bold ${isOverCalorie ? 'text-red-400' : 'text-emerald-400'}`}>
              {isOverCalorie ? `${Math.abs(caloriesRemaining)} kcal over` : `${caloriesRemaining} kcal left`}
            </span>
          </div>

          <div>
            <p className="text-2xl font-black text-white">
              {Math.round(totals.calories)}{' '}
              <span className="text-xs font-normal text-gray-400">/ {targets.calories} kcal</span>
            </p>
          </div>

          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverCalorie ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, Math.round((totals.calories / targets.calories) * 100))}%` }}
            />
          </div>
        </div>

        {/* Protein Card */}
        <div className="card p-4 space-y-2 border-emerald-500/20 bg-gray-900/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">Protein</span>
            <span className="text-[11px] font-bold text-emerald-400">
              {Math.min(100, Math.round((totals.protein / targets.protein) * 100))}%
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">
              {Math.round(totals.protein)}
              <span className="text-xs font-normal text-gray-400"> / {targets.protein}g</span>
            </p>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totals.protein / targets.protein) * 100))}%` }}
            />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="card p-4 space-y-2 border-blue-500/20 bg-gray-900/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">Carbs</span>
            <span className="text-[11px] font-bold text-blue-400">
              {Math.min(100, Math.round((totals.carbs / targets.carbs) * 100))}%
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">
              {Math.round(totals.carbs)}
              <span className="text-xs font-normal text-gray-400"> / {targets.carbs}g</span>
            </p>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totals.carbs / targets.carbs) * 100))}%` }}
            />
          </div>
        </div>

        {/* Fat Card */}
        <div className="card p-4 space-y-2 border-amber-500/20 bg-gray-900/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">Fat</span>
            <span className="text-[11px] font-bold text-amber-400">
              {Math.min(100, Math.round((totals.fat / targets.fat) * 100))}%
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400">
              {Math.round(totals.fat)}
              <span className="text-xs font-normal text-gray-400"> / {targets.fat}g</span>
            </p>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totals.fat / targets.fat) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Meals list & AI Workout Nutrition Timing */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommended Meal Suggestions for this Workout Day */}
          {(advisor.mealSuggestions.preWorkout || advisor.mealSuggestions.postWorkout) && (
            <div className="card p-5 space-y-3 border-emerald-500/20 bg-gray-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">
                    AI Suggested Nutrition for {advisor.focus}
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400">Click to quick-log</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {advisor.mealSuggestions.preWorkout && (
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                        Pre-Workout Fuel
                      </span>
                      <span className="text-xs font-bold text-gray-300">
                        {advisor.mealSuggestions.preWorkout.calories} kcal
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">
                      {advisor.mealSuggestions.preWorkout.name.split(':')[1] || advisor.mealSuggestions.preWorkout.name}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {advisor.mealSuggestions.preWorkout.reason}
                    </p>
                    <button
                      onClick={() => handleQuickLogSuggestion(advisor.mealSuggestions.preWorkout)}
                      className="w-full btn btn-secondary btn-sm text-[11px] py-1.5 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} /> Log Pre-Workout Meal
                    </button>
                  </div>
                )}

                {advisor.mealSuggestions.postWorkout && (
                  <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        {advisor.isWorkoutDay ? 'Post-Workout Recovery' : 'Rest Day Recovery Plate'}
                      </span>
                      <span className="text-xs font-bold text-gray-300">
                        {advisor.mealSuggestions.postWorkout.calories} kcal
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">
                      {advisor.mealSuggestions.postWorkout.name.split(':')[1] || advisor.mealSuggestions.postWorkout.name}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {advisor.mealSuggestions.postWorkout.reason}
                    </p>
                    <button
                      onClick={() => handleQuickLogSuggestion(advisor.mealSuggestions.postWorkout)}
                      className="w-full btn btn-secondary btn-sm text-[11px] py-1.5 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} /> Log Recovery Meal
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meals List by Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-white">Logged Meals for {selectedDate}</h2>
              <span className="text-xs text-gray-400">{meals.length} total meals</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : meals.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '3rem' }}>
                  <div className="empty-state-icon">
                    <Apple size={28} />
                  </div>
                  <p className="font-semibold text-white">No meals logged for this day</p>
                  <p className="text-sm text-gray-400">
                    Track meals to see how your nutrition aligns with your AI workout plan.
                  </p>
                  <button
                    onClick={() => {
                      setModalInitialData(null);
                      setEditMeal(null);
                      setShowModal(true);
                    }}
                    className="btn btn-primary btn-sm mt-3"
                  >
                    <Plus size={14} /> Log Your First Meal
                  </button>
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([type, typeMeals]) => (
                <div key={type} className="card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: mealTypeColors[type] }} />
                    <h3 className="font-bold text-white capitalize">{type.replace('_', ' ')}</h3>
                    <span className="text-xs ml-auto font-bold text-gray-400">
                      {typeMeals.reduce((s, m) => s + m.calories, 0)} kcal
                    </span>
                  </div>

                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <div
                        key={meal._id}
                        className="flex items-center justify-between p-2.5 rounded-lg"
                        style={{ background: 'var(--color-surface-2)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-white">{meal.name}</p>
                          <div className="flex gap-3 text-xs mt-0.5 text-gray-400">
                            <span className="text-orange-400 font-medium">
                              <Flame size={11} className="inline mr-0.5" />
                              {meal.calories} kcal
                            </span>
                            <span className="text-emerald-400">P: {meal.protein}g</span>
                            <span className="text-blue-400">C: {meal.carbs}g</span>
                            <span className="text-amber-400">F: {meal.fat}g</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => {
                              setEditMeal(meal);
                              setShowModal(true);
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.25rem' }}
                            title="Edit meal"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(meal._id)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.25rem', color: 'var(--color-danger)' }}
                            title="Delete meal"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Daily Macro Breakdown & Hydration Tracker */}
        <div className="space-y-5">
          {/* Daily Hydration Card */}
          <div className="card p-5 space-y-3 border-cyan-500/20 bg-gray-900/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-cyan-400" />
                <h3 className="font-bold text-white">Daily Hydration</h3>
              </div>
              <span className="text-xs font-bold text-cyan-400">
                {Math.min(100, Math.round((waterLoggedMl / targets.waterMl) * 100))}%
              </span>
            </div>

            <div>
              <p className="text-2xl font-black text-white">
                {waterLoggedMl} <span className="text-xs font-normal text-gray-400">/ {targets.waterMl} ml</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {advisor.isWorkoutDay
                  ? 'Includes +650ml extra hydration for today’s active workout.'
                  : 'Standard baseline recovery hydration target.'}
              </p>
            </div>

            <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((waterLoggedMl / targets.waterMl) * 100))}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => addWater(250)}
                className="btn btn-secondary btn-sm text-xs py-1.5 flex items-center justify-center gap-1"
              >
                <Plus size={13} /> 250ml Glass
              </button>
              <button
                type="button"
                onClick={() => addWater(500)}
                className="btn btn-secondary btn-sm text-xs py-1.5 flex items-center justify-center gap-1"
              >
                <Plus size={13} /> 500ml Bottle
              </button>
            </div>
          </div>

          {/* Macro Breakdown Pie Chart */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-white">Daily Macro Distribution</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Protein', val: totals.protein, target: targets.protein, color: '#10b981' },
                { label: 'Carbs', val: totals.carbs, target: targets.carbs, color: '#3b82f6' },
                { label: 'Fat', val: totals.fat, target: targets.fat, color: '#f59e0b' },
              ].map(({ label, val, target, color }) => (
                <div
                  key={label}
                  className="text-center p-2.5 rounded-xl border border-gray-800/80"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  <p className="text-sm font-bold" style={{ color }}>
                    {Math.round(val)}g
                  </p>
                  <p className="text-[10px] text-gray-400">Target: {target}g</p>
                </div>
              ))}
            </div>

            {macroData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    dataKey="value"
                  >
                    {macroData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(v) => [`${v}g`]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {val}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6 text-xs text-gray-500">
                Log meals to visualize your macro breakdown.
              </div>
            )}
          </div>
        </div>
      </div>

      {(showModal || editMeal) && (
        <MealModal
          onClose={() => {
            setShowModal(false);
            setEditMeal(null);
            setModalInitialData(null);
          }}
          onSaved={handleSaved}
          existing={editMeal}
          initialData={modalInitialData}
        />
      )}
    </div>
  );
};

export default NutritionPage;
