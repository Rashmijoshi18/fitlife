import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const GOAL_TYPES = [
  { value: 'workout_frequency', label: 'Workout Frequency' },
  { value: 'workout_duration', label: 'Total Duration' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'calories_burned', label: 'Calories Burned' },
  { value: 'custom', label: 'Custom' },
];

const GoalModal = ({ onClose, onSaved, existing }) => {
  const [form, setForm] = useState(existing ? {
    title: existing.title,
    description: existing.description || '',
    type: existing.type,
    targetValue: existing.targetValue,
    currentValue: existing.currentValue,
    unit: existing.unit,
    targetDate: existing.targetDate ? format(parseISO(existing.targetDate), 'yyyy-MM-dd') : '',
  } : {
    title: '', description: '', type: 'workout_frequency',
    targetValue: '', currentValue: 0, unit: 'workouts', targetDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.targetValue || Number(form.targetValue) <= 0) e.targetValue = 'Target value must be positive';
    if (!form.unit.trim()) e.unit = 'Unit is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (existing) {
        await api.patch(`/goals/${existing._id}`, form);
        toast.success('Goal updated!');
      } else {
        await api.post('/goals', form);
        toast.success('Goal created!');
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
          <h2 className="text-xl font-bold">{existing ? 'Edit Goal' : 'New Goal'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input className={`form-input ${errors.title ? 'error' : ''}`}
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Work out 5x per week" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Goal Type</label>
            <select className="form-input form-select" value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {GOAL_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Target Value *</label>
              <input type="number" className={`form-input ${errors.targetValue ? 'error' : ''}`}
                value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))}
                placeholder="e.g. 20" min="0" />
              {errors.targetValue && <span className="form-error">{errors.targetValue}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit *</label>
              <input className={`form-input ${errors.unit ? 'error' : ''}`}
                value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                placeholder="workouts / kg / minutes" />
              {errors.unit && <span className="form-error">{errors.unit}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Current Progress</label>
              <input type="number" className="form-input"
                value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))}
                placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Target Date (optional)</label>
              <input type="date" className="form-input"
                value={form.targetDate} onChange={e => setForm(p => ({ ...p, targetDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea className="form-input" rows={2}
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="More details about this goal…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (existing ? 'Update Goal' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateProgressModal = ({ goal, onClose, onSaved }) => {
  const [value, setValue] = useState(goal.currentValue);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/goals/${goal._id}`, { currentValue: Number(value), progressNote: note });
      toast.success('Progress updated!');
      onSaved();
    } catch { toast.error('Failed to update progress'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '380px' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-bold">Update Progress</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="font-semibold">{goal.title}</p>
          <div className="form-group">
            <label className="form-label">Current Value ({goal.unit})</label>
            <input type="number" className="form-input" value={value}
              onChange={e => setValue(e.target.value)} min="0" max={goal.targetValue * 2} />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Target: {goal.targetValue} {goal.unit}
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input className="form-input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Feeling great!" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? '…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [progressGoal, setProgressGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals', { params: { status: filterStatus || undefined } });
      setGoals(res.data.goals);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      fetchGoals();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaved = () => {
    setShowModal(false); setEditGoal(null); setProgressGoal(null);
    fetchGoals();
  };

  const statusColor = { active: '#10b981', completed: '#3b82f6', abandoned: '#9ca3af' };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Goals</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Set and track your fitness objectives</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {['', 'active', 'completed', 'abandoned'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={28} /></div>
          <p className="font-semibold">No goals yet</p>
          <p className="text-sm">Create a goal to start tracking your progress.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm mt-2">
            <Plus size={14} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(g => (
            <div key={g._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold">{g.title}</h3>
                    <span className="badge" style={{ background: `${statusColor[g.status]}20`, color: statusColor[g.status] }}>
                      {g.status}
                    </span>
                    {g.status === 'completed' && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
                  </div>
                  {g.description && <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{g.description}</p>}

                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--color-text-muted)' }}>{g.currentValue} / {g.targetValue} {g.unit}</span>
                      <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{g.completionPercentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${g.completionPercentage}%` }} />
                    </div>
                  </div>

                  {g.targetDate && (
                    <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                      Target date: {format(parseISO(g.targetDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {g.status === 'active' && (
                    <button onClick={() => setProgressGoal(g)} className="btn btn-primary btn-sm">Update</button>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => { setEditGoal(g); setShowModal(true); }} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(g._id)} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem', color: 'var(--color-danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showModal || editGoal) && (
        <GoalModal onClose={() => { setShowModal(false); setEditGoal(null); }} onSaved={handleSaved} existing={editGoal} />
      )}
      {progressGoal && (
        <UpdateProgressModal goal={progressGoal} onClose={() => setProgressGoal(null)} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default GoalsPage;
