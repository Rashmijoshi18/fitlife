import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Dumbbell, Target, Apple, Flame, Clock, TrendingUp, Plus, ArrowRight, Camera, Sparkles, Calendar, Zap } from 'lucide-react';
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

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    api.get('/progress/summary')
      .then(res => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load dashboard data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
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
      <p className="text-sm">Unable to connect to service. Try refreshing or logging in again.</p>
      <button onClick={loadDashboard} className="btn btn-secondary btn-sm mt-2">Retry</button>
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
    <div className="fade-in max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {format(new Date(), 'EEEE, MMMM d')} — Here's your fitness overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/workout-studio" className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/40">
            <Camera size={15} /> AI Studio
          </Link>
          <Link to="/workouts" className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <Plus size={15} /> Log Workout
          </Link>
        </div>
      </div>

      {/* AI Quick Actions Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/workout-studio"
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-900 border border-emerald-500/30 hover:border-emerald-400 transition-all duration-200 group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Camera size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                MediaPipe AI
              </span>
            </div>
            <h3 className="font-bold text-sm text-white mt-2.5 group-hover:text-emerald-400 transition-colors">
              AI Workout Studio
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Live camera pose detection, automatic rep counting & posture corrections.
            </p>
          </div>
          <ArrowRight size={16} className="text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all mt-1" />
        </Link>

        <Link
          to="/ai-coach"
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-gray-900 to-gray-900 border border-purple-500/30 hover:border-purple-400 transition-all duration-200 group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Gemini 2.5
              </span>
            </div>
            <h3 className="font-bold text-sm text-white mt-2.5 group-hover:text-purple-400 transition-colors">
              Gemini Fitness Coach
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Ask fitness questions, get form tips, diet advice, and recovery guidance.
            </p>
          </div>
          <ArrowRight size={16} className="text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all mt-1" />
        </Link>

        <Link
          to="/weekly-planner"
          className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-gray-900 to-gray-900 border border-blue-500/30 hover:border-blue-400 transition-all duration-200 group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                AI Routine
              </span>
            </div>
            <h3 className="font-bold text-sm text-white mt-2.5 group-hover:text-blue-400 transition-colors">
              Weekly Workout Plan
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              7-day personalized split with target muscle groups and video tutorials.
            </p>
          </div>
          <ArrowRight size={16} className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-1" />
        </Link>
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
