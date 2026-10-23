import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'cardio', 'full_body'];
const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'other'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const diffColors = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' };

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (muscleGroup) params.muscleGroup = muscleGroup;
      if (equipment) params.equipment = equipment;
      if (difficulty) params.difficulty = difficulty;
      const res = await api.get('/exercises', { params });
      setExercises(res.data.exercises);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, muscleGroup, equipment, difficulty]);

  useEffect(() => {
    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [fetch]);

  const clear = () => { setSearch(''); setMuscleGroup(''); setEquipment(''); setDifficulty(''); };

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Exercise Library</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Browse {exercises.length}+ exercises with instructions and tips</p>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
          <input className="form-input" style={{ paddingLeft: '2.25rem' }}
            placeholder="Search exercises…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="form-group">
            <label className="form-label">Muscle Group</label>
            <select className="form-input form-select" value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)}>
              <option value="">All</option>
              {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Equipment</label>
            <select className="form-input form-select" value={equipment} onChange={e => setEquipment(e.target.value)}>
              <option value="">All</option>
              {EQUIPMENT.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select className="form-input form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="">All</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button onClick={clear} className="btn btn-secondary w-full">Clear Filters</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <p className="font-semibold">No exercises found</p>
          <p className="text-sm">Try adjusting your search or filters. Make sure exercises are seeded (run <code>npm run seed</code> in /server).</p>
          <button onClick={clear} className="btn btn-secondary btn-sm mt-2">Clear Filters</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {exercises.map(ex => (
            <div key={ex._id} className="card" style={{ padding: '1rem' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold">{ex.name}</h3>
                    <span className="badge" style={{ background: `${diffColors[ex.difficulty]}20`, color: diffColors[ex.difficulty] }}>
                      {ex.difficulty}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="badge badge-gray">{ex.muscleGroup.replace('_', ' ')}</span>
                    <span className="badge badge-gray">{ex.equipment}</span>
                    <span className="badge badge-blue">{ex.type}</span>
                  </div>
                </div>
                <button onClick={() => setExpandedId(expandedId === ex._id ? null : ex._id)}
                  className="btn btn-ghost btn-sm shrink-0" style={{ padding: '0.25rem' }}>
                  {expandedId === ex._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expandedId === ex._id && (
                <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                  {ex.instructions && (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{ex.instructions}</p>
                  )}
                  {ex.tips?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>Tips</p>
                      <ul className="space-y-1">
                        {ex.tips.map((t, i) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--color-text-muted)' }}>
                            <span style={{ color: 'var(--color-accent)' }}>•</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExercisesPage;
