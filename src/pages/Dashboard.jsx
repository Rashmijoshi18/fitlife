import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Dumbbell, Target, Apple, Flame, Clock, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { format, parseISO } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color = '#10b981' }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <div>
      <p className="text-2xl font-black mt-2">{value}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/progress/summary')
      .then(res => setSummary(res.data))
      .catch(() => setError('Could not load dashboard. Make sure the server is running.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="skeleton h-8 w-64 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon"><TrendingUp size={28} /></div>
      <p className="font-semibold text-red-400">{error}</p>
      <p className="text-sm">Start the backend server with <code className="px-2 py-0.5 rounded" style={{ background: 'var(--color-surface-2)' }}>npm run dev</code> in the <code>/server</code> folder.</p>
      <button onClick={() => window.location.reload()} className="btn btn-secondary btn-sm mt-2">Retry</button>
    </div>
  );

  const { summary: stats, todayNutrition, recentWorkouts, activeGoals, charts } = summary;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const customTooltipStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '12px',
  };

  return (
    <div className="fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {format(new Date(), 'EEEE, MMMM d')} — Here's your fitness overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/workouts" className="btn btn-primary btn-sm">
            <Plus size={15} /> Log Workout
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Dumbbell} label="Total Workouts" value={stats.totalWorkouts} sub="All time" color="#10b981" />
        <StatCard icon={Clock} label="Weekly Duration" value={`${stats.weekDuration}m`} sub="This week" color="#3b82f6" />
        <StatCard icon={Flame} label="Calories Burned" value={stats.weekCaloriesBurned} sub="This week (est.)" color="#f59e0b" />
        <StatCard icon={Target} label="Active Goals" value={stats.activeGoals} sub={`${stats.completedGoals} completed`} color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity */}
        <div className="card">
          <h2 className="font-bold mb-4">Weekly Activity</h2>
          {charts.weekly.every(d => d.workouts === 0) ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="text-sm">No workouts logged this week yet.</p>
              <Link to="/workouts" className="btn btn-primary btn-sm mt-2"><Plus size={14} /> Log your first workout</Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.weekly}>
                <defs>
                  <linearGradient id="workoutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={2} fill="url(#workoutGrad)" name="Duration (min)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Workouts */}
        <div className="card">
          <h2 className="font-bold mb-4">Monthly Overview</h2>
          {charts.monthly.every(d => d.workouts === 0) ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="text-sm">No workouts this month yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="workouts" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Workouts */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Workouts</h2>
            <Link to="/workouts" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentWorkouts.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon"><Dumbbell size={24} /></div>
              <p className="font-semibold">No workouts yet</p>
              <p className="text-sm">Log your first workout to see it here.</p>
              <Link to="/workouts" className="btn btn-primary btn-sm mt-2"><Plus size={14} /> Log Workout</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div key={w._id} className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--color-accent-dim)' }}>
                      <Dumbbell size={14} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{w.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {format(parseISO(w.date), 'MMM d')} · {w.duration} min
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-green">{w.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Today's Nutrition */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Today's Nutrition</h2>
              <Link to="/nutrition" className="text-sm" style={{ color: 'var(--color-accent)' }}>
                <Plus size={15} />
              </Link>
            </div>
            <p className="text-3xl font-black">{todayNutrition.calories} <span className="text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>kcal</span></p>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-subtle)' }}>Estimated from {todayNutrition.mealCount} meals logged today</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Protein', value: `${todayNutrition.protein}g`, color: '#10b981' },
                { label: 'Carbs', value: `${todayNutrition.carbs}g`, color: '#3b82f6' },
                { label: 'Fat', value: `${todayNutrition.fat}g`, color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                  <p className="text-sm font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Goals */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Active Goals</h2>
              <Link to="/goals" className="text-sm" style={{ color: 'var(--color-accent)' }}>
                <Plus size={15} />
              </Link>
            </div>
            {activeGoals.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>
                <p className="text-sm">No active goals. Set one to get started!</p>
                <Link to="/goals" className="btn btn-primary btn-sm mt-2"><Plus size={14} /> Add Goal</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map((g) => (
                  <div key={g._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{g.title}</span>
                      <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>{g.completionPercentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${g.completionPercentage}%` }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {g.currentValue} / {g.targetValue} {g.unit}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
