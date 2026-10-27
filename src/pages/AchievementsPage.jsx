import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Award,
  Flame,
  Zap,
  Dumbbell,
  Shield,
  Calendar,
  Compass,
  TrendingUp,
  Sparkles,
  Camera,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Target,
  BarChart2,
} from 'lucide-react';
import api from '../lib/api';
import {
  calculateWorkoutStats,
  getAchievementsList,
  getActiveChallenges,
  getUserRank,
} from '../lib/achievementsHelper';

// Map icon string names to Lucide icons
const ICON_MAP = {
  Camera,
  Zap,
  Dumbbell,
  Award,
  Shield,
  Flame,
  Calendar,
  Compass,
  Trophy,
  TrendingUp,
  Sparkles,
  Target,
};

export default function AchievementsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, unlocked, in_progress, challenges, records

  useEffect(() => {
    setLoading(true);
    api
      .get('/workouts?limit=100')
      .then((res) => {
        setWorkouts(res.data.workouts || []);
      })
      .catch((err) => {
        console.error('Error fetching workouts for achievements:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = calculateWorkoutStats(workouts);
  const badges = getAchievementsList(stats);
  const challenges = getActiveChallenges(stats);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalXP = badges
    .filter((b) => b.unlocked)
    .reduce((sum, b) => sum + b.xp, 0);

  const rank = getUserRank(totalXP);
  const rankProgress = Math.min(100, Math.round((totalXP / rank.nextXP) * 100));

  const filteredBadges = badges.filter((b) => {
    if (activeTab === 'unlocked') return b.unlocked;
    if (activeTab === 'in_progress') return !b.unlocked;
    return true;
  });

  if (loading) {
    return (
      <div className="fade-in max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-36 rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-6xl mx-auto space-y-6 pb-12">
      {/* Hero Header & Gamification Level */}
      <div className="card p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-900 border-emerald-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/60"
              style={{
                background: `${rank.color}20`,
                border: `1.5px solid ${rank.color}60`,
              }}
            >
              <Trophy size={32} style={{ color: rank.color }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{
                    background: `${rank.color}20`,
                    color: rank.color,
                    border: `1px solid ${rank.color}40`,
                  }}
                >
                  Rank: {rank.title} (Tier {rank.level})
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {totalXP} Total XP
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5">
                Achievements & Challenges
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                Every repetition and dumbbell lift automatically unlocks badges and rewards.
              </p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="w-full md:w-64 bg-gray-950/70 p-4 rounded-xl border border-gray-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400 font-medium">Next Tier Progress</span>
              <span className="font-bold text-white">
                {totalXP} / {rank.nextXP} XP
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 rounded-full"
                style={{ width: `${rankProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 text-right font-medium">
              {unlockedCount} of {badges.length} Badges Unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Quick Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{stats.totalReps}</p>
            <p className="text-xs text-gray-400">Total Reps Logged</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Dumbbell size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white">
              {stats.maxWeightRecord.weight > 0 ? `${stats.maxWeightRecord.weight} kg` : 'Bodyweight'}
            </p>
            <p className="text-xs text-gray-400">Max Dumbbell Load</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Flame size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{stats.totalCalories} kcal</p>
            <p className="text-xs text-gray-400">Total Burned</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{stats.distinctDaysCount} days</p>
            <p className="text-xs text-gray-400">Active Workout Days</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: `All Badges (${badges.length})` },
            { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
            { id: 'in_progress', label: `In Progress (${badges.length - unlockedCount})` },
            { id: 'challenges', label: `Active Challenges (${challenges.length})` },
            { id: 'records', label: 'Personal Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-950/40'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link
          to="/workout-studio"
          className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
        >
          <Camera size={14} /> Start AI Workout
        </Link>
      </div>

      {/* VIEW: Active Challenges */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`card p-5 space-y-4 border transition-all ${
                  c.completed
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-gray-800 bg-gray-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {c.tag}
                  </span>
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                    <Sparkles size={13} /> +{c.rewardXP} XP
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{c.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{c.description}</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {c.current} / {c.target} {c.unit} ({c.progress}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.completed ? 'bg-emerald-500' : 'bg-emerald-400/80'
                      }`}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {c.daysLeft} days remaining
                  </span>
                  {c.completed ? (
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <Link
                      to="/workout-studio"
                      className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      Progress Now <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Personal Records (PRs) */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-gray-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                  Single-Set Rep Record
                </span>
                <Award size={18} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white">
                {stats.maxRepsRecord.reps > 0 ? `${stats.maxRepsRecord.reps} reps` : '0 reps'}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                Exercise: <strong className="text-white">{stats.maxRepsRecord.exercise}</strong>
              </p>
            </div>

            <div className="card p-5 border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-gray-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                  Heaviest Dumbbell
                </span>
                <Dumbbell size={18} className="text-purple-400" />
              </div>
              <p className="text-3xl font-black text-white">
                {stats.maxWeightRecord.weight > 0 ? `${stats.maxWeightRecord.weight} kg` : '0 kg'}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                Lift: <strong className="text-white">{stats.maxWeightRecord.exercise}</strong>
              </p>
            </div>

            <div className="card p-5 border-orange-500/30 bg-gradient-to-b from-orange-950/20 to-gray-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-orange-400 tracking-wider">
                  Peak Workout Calories
                </span>
                <Flame size={18} className="text-orange-400" />
              </div>
              <p className="text-3xl font-black text-white">
                {stats.maxCaloriesRecord.calories > 0
                  ? `${stats.maxCaloriesRecord.calories} kcal`
                  : '0 kcal'}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                Session: <strong className="text-white">{stats.maxCaloriesRecord.title}</strong>
              </p>
            </div>

            <div className="card p-5 border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-gray-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">
                  Longest Session
                </span>
                <Clock size={18} className="text-blue-400" />
              </div>
              <p className="text-3xl font-black text-white">
                {stats.maxDurationRecord.duration > 0
                  ? `${stats.maxDurationRecord.duration} min`
                  : '0 min'}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                Session: <strong className="text-white">{stats.maxDurationRecord.title}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Badges Grid (All / Unlocked / In Progress) */}
      {activeTab !== 'challenges' && activeTab !== 'records' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const IconComponent = ICON_MAP[badge.icon] || Trophy;

            return (
              <div
                key={badge.id}
                className={`card p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                  badge.unlocked
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/15 via-gray-900 to-gray-900 shadow-lg shadow-emerald-950/30'
                    : 'border-gray-800 bg-gray-900/50 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform"
                      style={{
                        background: badge.unlocked ? `${badge.color}20` : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${badge.unlocked ? `${badge.color}50` : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <IconComponent
                        size={22}
                        style={{ color: badge.unlocked ? badge.color : '#94a3b8' }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        +{badge.xp} XP
                      </span>
                      {badge.unlocked ? (
                        <span className="text-emerald-400" title="Unlocked">
                          <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <span className="text-gray-500" title="Locked">
                          <Lock size={15} />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white">{badge.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/80">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400 font-medium">
                      {badge.unlocked ? 'Requirement Met' : 'Progress'}
                    </span>
                    <span className="font-bold text-white">
                      {badge.current} / {badge.target} {badge.unit || ''}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${badge.progress}%`,
                        background: badge.unlocked ? badge.color : '#64748b',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
