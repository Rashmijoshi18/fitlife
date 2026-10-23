import { useState, useEffect, useCallback } from 'react';
import { Plus, Apple, Trash2, Edit2, X, Flame } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
const mealTypeColors = { breakfast: '#f59e0b', lunch: '#10b981', dinner: '#3b82f6', snack: '#8b5cf6', pre_workout: '#ef4444', post_workout: '#06b6d4' };

const MealModal = ({ onClose, onSaved, existing }) => {
  const [form, setForm] = useState(existing ? {
    name: existing.name, mealType: existing.mealType,
    date: format(parseISO(existing.date), 'yyyy-MM-dd'),
    servingSize: existing.servingSize, servingUnit: existing.servingUnit,
    calories: existing.calories, protein: existing.protein || 0,
    carbs: existing.carbs || 0, fat: existing.fat || 0, notes: existing.notes || '',
  } : {
    name: '', mealType: 'breakfast', date: format(new Date(), 'yyyy-MM-dd'),
    servingSize: 1, servingUnit: 'serving', calories: '',
    protein: 0, carbs: 0, fat: 0, notes: '',
  });
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
    if (Object.keys(e).length) { setErrors(e); return; }
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
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold">{existing ? 'Edit Meal' : 'Log Meal'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-text-muted)' }}>
            ℹ️ Nutritional values are user-entered estimates for tracking purposes only.
          </div>

          <div className="form-group">
            <label className="form-label">Food/Meal Name *</label>
            <input className={`form-input ${errors.name ? 'error' : ''}`}
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Oatmeal with banana" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Meal Type</label>
              <select className="form-input form-select" value={form.mealType}
                onChange={e => setForm(p => ({ ...p, mealType: e.target.value }))}>
                {MEAL_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input"
                value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Serving Size</label>
              <input type="number" className="form-input"
                value={form.servingSize} onChange={e => setForm(p => ({ ...p, servingSize: e.target.value }))}
                placeholder="1" min="0.1" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Serving Unit</label>
              <input className="form-input" value={form.servingUnit}
                onChange={e => setForm(p => ({ ...p, servingUnit: e.target.value }))}
                placeholder="serving / cup / g" />
            </div>
          </div>

          <div>
            <p className="form-label mb-2">Nutrition (estimated)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Calories (kcal) *</label>
                <input type="number" className={`form-input ${errors.calories ? 'error' : ''}`}
                  value={form.calories} onChange={e => setForm(p => ({ ...p, calories: e.target.value }))}
                  placeholder="0" min="0" />
                {errors.calories && <span className="form-error">{errors.calories}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Protein (g)</label>
                <input type="number" className="form-input"
                  value={form.protein} onChange={e => setForm(p => ({ ...p, protein: e.target.value }))}
                  placeholder="0" min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label className="form-label">Carbs (g)</label>
                <input type="number" className="form-input"
                  value={form.carbs} onChange={e => setForm(p => ({ ...p, carbs: e.target.value }))}
                  placeholder="0" min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label className="form-label">Fat (g)</label>
                <input type="number" className="form-input"
                  value={form.fat} onChange={e => setForm(p => ({ ...p, fat: e.target.value }))}
                  placeholder="0" min="0" step="0.1" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (existing ? 'Update' : 'Log Meal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NutritionPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/meals', { params: { date: selectedDate } });
      setMeals(res.data.meals);
    } catch { toast.error('Failed to load meals'); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Meal deleted');
      fetchMeals();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaved = () => { setShowModal(false); setEditMeal(null); fetchMeals(); };

  // Daily totals
  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Protein', value: Math.round(totals.protein), color: '#10b981' },
    { name: 'Carbs', value: Math.round(totals.carbs), color: '#3b82f6' },
    { name: 'Fat', value: Math.round(totals.fat), color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Group by meal type
  const grouped = MEAL_TYPES.reduce((acc, t) => {
    const type_meals = meals.filter(m => m.mealType === t);
    if (type_meals.length > 0) acc[t] = type_meals;
    return acc;
  }, {});

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Nutrition</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Track your daily meals and macros</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Log Meal
        </button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-4 mb-6">
        <input type="date" className="form-input" style={{ width: 'auto' }}
          value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        <button onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))} className="btn btn-secondary btn-sm">Today</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Meals list */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : meals.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon"><Apple size={28} /></div>
                <p className="font-semibold">No meals logged for this day</p>
                <p className="text-sm">Start tracking your nutrition!</p>
                <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm mt-2">
                  <Plus size={14} /> Log Your First Meal
                </button>
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([type, typeMeals]) => (
              <div key={type} className="card" style={{ padding: '1rem' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: mealTypeColors[type] }} />
                  <h3 className="font-bold capitalize">{type.replace('_', ' ')}</h3>
                  <span className="text-sm ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                    {typeMeals.reduce((s, m) => s + m.calories, 0)} kcal
                  </span>
                </div>
                <div className="space-y-2">
                  {typeMeals.map(meal => (
                    <div key={meal._id} className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: 'var(--color-surface-2)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{meal.name}</p>
                        <div className="flex gap-3 text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          <span><Flame size={10} className="inline mr-0.5" />{meal.calories} kcal</span>
                          <span>P: {meal.protein}g</span>
                          <span>C: {meal.carbs}g</span>
                          <span>F: {meal.fat}g</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => { setEditMeal(meal); setShowModal(true); }} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(meal._id)} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem', color: 'var(--color-danger)' }}>
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

        {/* Right: Daily summary */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold mb-4">Daily Summary</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-subtle)' }}>All values are user-entered estimates.</p>
            <div className="text-center mb-4">
              <p className="text-4xl font-black">{Math.round(totals.calories)}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>kcal today</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Protein', val: totals.protein, color: '#10b981' },
                { label: 'Carbs', val: totals.carbs, color: '#3b82f6' },
                { label: 'Fat', val: totals.fat, color: '#f59e0b' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                  <p className="text-sm font-bold" style={{ color }}>{Math.round(val)}g</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            {macroData.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                    {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v) => [`${v}g`]}
                  />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(val) => <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <p className="text-sm font-semibold mb-2">Meal Count</p>
            <p className="text-2xl font-black">{meals.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>meals today</p>
          </div>
        </div>
      </div>

      {(showModal || editMeal) && (
        <MealModal onClose={() => { setShowModal(false); setEditMeal(null); }} onSaved={handleSaved} existing={editMeal} />
      )}
    </div>
  );
};

export default NutritionPage;
