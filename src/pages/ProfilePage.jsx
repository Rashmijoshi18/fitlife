import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Weight,
  Ruler,
  Flame,
  Activity,
  Lock,
  Check,
  Sparkles,
  Droplets,
  Heart,
  Scale,
  ArrowRight,
  Info,
} from 'lucide-react';
import { calculateBiometrics } from '../lib/biometrics';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    fitnessLevel: user?.fitnessLevel || 'beginner',
    age: user?.age || 25,
    weight: user?.weight || 70,
    height: user?.height || 175,
    gender: user?.gender || 'male',
    dailyCalorieTarget: user?.dailyCalorieTarget || 2000,
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passErrors, setPassErrors] = useState({});

  // Compute live biometrics dynamically as user edits their weight/height/age/gender
  const bio = calculateBiometrics({
    weight: profileForm.weight,
    height: profileForm.height,
    age: profileForm.age,
    gender: profileForm.gender,
    fitnessLevel: profileForm.fitnessLevel,
  });

  const handleProfileSave = async (ev) => {
    ev.preventDefault();
    setProfileLoading(true);
    try {
      const payload = {
        ...profileForm,
        weight: Number(profileForm.weight) || 70,
        height: Number(profileForm.height) || 175,
        age: Number(profileForm.age) || 25,
        dailyCalorieTarget: Number(profileForm.dailyCalorieTarget) || bio.tdee,
      };
      const res = await api.patch('/auth/profile', payload);
      updateUser(res.data.user);
      toast.success('Biometric profile updated! All AI calorie formulas synchronized.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleApplyRecommendedTDEE = () => {
    setProfileForm((prev) => ({
      ...prev,
      dailyCalorieTarget: bio.tdee,
    }));
    toast.success(`Target updated to ${bio.tdee} kcal based on your height & weight!`);
  };

  const handlePasswordChange = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!passForm.currentPassword) e.currentPassword = 'Required';
    if (!passForm.newPassword || passForm.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters';
    if (passForm.newPassword !== passForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (Object.keys(e).length) {
      setPassErrors(e);
      return;
    }
    setPassErrors({});
    setPassLoading(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black">Profile & Biometrics</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Manage your physical measurements and synchronize accurate calorie calculations.
        </p>
      </div>

      {/* User Header Card */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-5 border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 via-gray-900 to-gray-900">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-950/50 shrink-0"
          style={{ background: 'var(--color-accent)', color: '#000' }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xl font-bold text-white">{user?.name}</p>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 text-xs text-gray-400">
            <Mail size={13} />
            <span>{user?.email}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Weight: {profileForm.weight} kg
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Height: {profileForm.height} cm
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${bio.bmiColor}20`, color: bio.bmiColor, border: `1px solid ${bio.bmiColor}40` }}
            >
              BMI: {bio.bmi} ({bio.bmiCategory})
            </span>
          </div>
        </div>
      </div>

      {/* ─── LIVE ACCURATE BIOMETRICS DASHBOARD ─────────────────────────────── */}
      <div className="card p-6 space-y-4 border-emerald-500/30 bg-gray-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Live Biometric Calculations</h2>
          </div>
          <span className="text-xs text-gray-400">Mifflin-St Jeor Clinical Formula</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* BMI Card */}
          <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Scale size={14} className="text-emerald-400" /> BMI Index
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${bio.bmiColor}20`, color: bio.bmiColor }}
              >
                {bio.bmiCategory}
              </span>
            </div>
            <p className="text-2xl font-black text-white">{bio.bmi}</p>
            <p className="text-[11px] text-gray-500">
              Ideal range: {bio.idealWeight.min}–{bio.idealWeight.max} kg
            </p>
          </div>

          {/* BMR Card */}
          <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Heart size={14} className="text-red-400" /> BMR (Resting)
              </span>
            </div>
            <p className="text-2xl font-black text-white">
              {bio.bmr} <span className="text-xs font-normal text-gray-400">kcal</span>
            </p>
            <p className="text-[11px] text-gray-500">Baseline organs at complete rest</p>
          </div>

          {/* TDEE Maintenance */}
          <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Flame size={14} className="text-orange-400" /> TDEE Daily
              </span>
            </div>
            <p className="text-2xl font-black text-white">
              {bio.tdee} <span className="text-xs font-normal text-gray-400">kcal</span>
            </p>
            <p className="text-[11px] text-gray-500">Daily maintenance expenditure</p>
          </div>

          {/* Optimal Water */}
          <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                <Droplets size={14} className="text-cyan-400" /> Daily Water
              </span>
            </div>
            <p className="text-2xl font-black text-white">
              {(bio.dailyWaterMl / 1000).toFixed(1)}{' '}
              <span className="text-xs font-normal text-gray-400">L / day</span>
            </p>
            <p className="text-[11px] text-gray-500">35 ml per kg bodyweight</p>
          </div>
        </div>

        {/* TDEE Sync Prompt */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-gray-300">
            Based on your measurements of <strong>{profileForm.weight} kg</strong> and{' '}
            <strong>{profileForm.height} cm</strong>, your recommended daily intake is{' '}
            <strong className="text-emerald-400">{bio.tdee} kcal</strong>.
          </div>
          <button
            type="button"
            onClick={handleApplyRecommendedTDEE}
            className="btn btn-primary btn-sm text-xs shrink-0 py-1.5"
          >
            Apply {bio.tdee} kcal as Target
          </button>
        </div>
      </div>

      {/* ─── Profile Form ──────────────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-5">Edit Physical Measurements</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2 md:col-span-1">
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Level</label>
              <select
                className="form-input form-select"
                value={profileForm.fitnessLevel}
                onChange={(e) => setProfileForm((p) => ({ ...p, fitnessLevel: e.target.value }))}
              >
                <option value="beginner">Beginner (1–2 days/week)</option>
                <option value="intermediate">Intermediate (3–5 days/week)</option>
                <option value="advanced">Advanced (6+ days/week)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                placeholder="years"
                value={profileForm.age}
                onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                min="10"
                max="120"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg) *</label>
              <div className="relative">
                <Weight
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                />
                <input
                  type="number"
                  className="form-input font-bold text-emerald-400"
                  style={{ paddingLeft: '2rem' }}
                  value={profileForm.weight}
                  onChange={(e) => setProfileForm((p) => ({ ...p, weight: e.target.value }))}
                  min="20"
                  max="400"
                  step="0.1"
                  placeholder="kg"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm) *</label>
              <div className="relative">
                <Ruler
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                />
                <input
                  type="number"
                  className="form-input font-bold text-blue-400"
                  style={{ paddingLeft: '2rem' }}
                  value={profileForm.height}
                  onChange={(e) => setProfileForm((p) => ({ ...p, height: e.target.value }))}
                  min="80"
                  max="260"
                  placeholder="cm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Biological Gender</label>
              <select
                className="form-input form-select"
                value={profileForm.gender}
                onChange={(e) => setProfileForm((p) => ({ ...p, gender: e.target.value }))}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Daily Calorie Target (kcal)</label>
              <div className="relative">
                <Flame
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
                />
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: '2rem' }}
                  value={profileForm.dailyCalorieTarget}
                  onChange={(e) => setProfileForm((p) => ({ ...p, dailyCalorieTarget: e.target.value }))}
                  min="500"
                  max="10000"
                  placeholder="2000"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="btn btn-primary flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            {profileLoading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} /> Save Changes & Update AI Calculations
              </>
            )}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                className={`form-input ${passErrors.currentPassword ? 'error' : ''}`}
                style={{ paddingLeft: '2.25rem' }}
                value={passForm.currentPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </div>
            {passErrors.currentPassword && <span className="form-error">{passErrors.currentPassword}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                className={`form-input ${passErrors.newPassword ? 'error' : ''}`}
                style={{ paddingLeft: '2.25rem' }}
                value={passForm.newPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>
            {passErrors.newPassword && <span className="form-error">{passErrors.newPassword}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                className={`form-input ${passErrors.confirmPassword ? 'error' : ''}`}
                style={{ paddingLeft: '2.25rem' }}
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
            {passErrors.confirmPassword && <span className="form-error">{passErrors.confirmPassword}</span>}
          </div>

          <button type="submit" disabled={passLoading} className="btn btn-secondary">
            {passLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={15} /> Change Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
