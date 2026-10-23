import { useState, useEffect, useCallback } from 'react';
import { Plus, Dumbbell, Clock, Flame, Trash2, Edit2, ChevronDown, ChevronUp, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other'];

const WorkoutModal = ({ onClose, onSaved, existing }) => {
  const [form, setForm] = useState(existing || {
    title: '', date: format(new Date(), 'yyyy-MM-dd'), duration: '',
    type: 'strength', caloriesBurned: '', notes: '', mood: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.duration || Number(form.duration) < 1) e.duration = 'Duration must be at least 1 minute';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (existing) {
        await api.patch(`/workouts/${existing._id}`, form);
        toast.success('Workout updated!');
      } else {
        await api.post('/workouts', form);
        toast.success('Workout logged!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold">{existing ? 'Edit Workout' : 'Log Workout'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="form-group">
            <label className="form-label">Workout Title *</label>
            <input className={`form-input ${errors.title ? 'error' : ''}`}
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Morning Push Day" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input"
                value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (min) *</label>
              <input type="number" className={`form-input ${errors.duration ? 'error' : ''}`}
                value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                placeholder="e.g. 60" min="1" max="600" />
              {errors.duration && <span className="form-error">{errors.duration}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input form-select" value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Calories Burned (est.)</label>
              <input type="number" className="form-input"
                value={form.caloriesBurned} onChange={e => setForm(p => ({ ...p, caloriesBurned: e.target.value }))}
                placeholder="e.g. 350" min="0" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mood</label>
            <select className="form-input form-select" value={form.mood}
              onChange={e => setForm(p => ({ ...p, mood: e.target.value }))}>
              <option value="">— Select —</option>
              {['great', 'good', 'okay', 'tired', 'bad'].map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3}
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="How did it go? Any personal records?" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (existing ? 'Update' : 'Log Workout')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const typeColors = { strength: '#10b981', cardio: '#3b82f6', flexibility: '#8b5cf6', hiit: '#ef4444', sports: '#f59e0b', other: '#9ca3af' };

const WorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWorkout, setEditWorkout] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const res = await api.get('/workouts', { params });
      setWorkouts(res.data.workouts);
    } catch { toast.error('Failed to load workouts'); }
    finally { setLoading(false); }
  }, [filterType]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/${id}`);
      toast.success('Workout deleted');
      fetchWorkouts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditWorkout(null);
    fetchWorkouts();
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Workouts</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Track and manage your workout sessions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Log Workout
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterType('')}
          className={`btn btn-sm ${!filterType ? 'btn-primary' : 'btn-secondary'}`}>All</button>
        {WORKOUT_TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : workouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Dumbbell size={28} /></div>
          <p className="font-semibold">No workouts logged yet</p>
          <p className="text-sm">Start tracking your fitness journey!</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm mt-2">
            <Plus size={14} /> Log Your First Workout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map(w => (
            <div key={w._id} className="card" style={{ padding: '1rem' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${typeColors[w.type] || '#9ca3af'}20` }}>
                  <Dumbbell size={18} style={{ color: typeColors[w.type] || '#9ca3af' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate">{w.title}</p>
                    <span className="badge" style={{ background: `${typeColors[w.type]}20`, color: typeColors[w.type] }}>{w.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span><Clock size={11} className="inline mr-1" />{w.duration} min</span>
                    {w.caloriesBurned > 0 && <span><Flame size={11} className="inline mr-1" />{w.caloriesBurned} kcal (est.)</span>}
                    <span>{format(parseISO(w.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditWorkout(w); setShowModal(true); }} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(w._id)} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem', color: 'var(--color-danger)' }}>
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === w._id ? null : w._id)} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}>
                    {expandedId === w._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expandedId === w._id && w.notes && (
                <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <strong className="text-white">Notes:</strong> {w.notes}
                  {w.mood && <span className="ml-3">Mood: <span className="capitalize font-medium">{w.mood}</span></span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showModal || editWorkout) && (
        <WorkoutModal
          onClose={() => { setShowModal(false); setEditWorkout(null); }}
          onSaved={handleSaved}
          existing={editWorkout}
        />
      )}
    </div>
  );
};

export default WorkoutsPage;
