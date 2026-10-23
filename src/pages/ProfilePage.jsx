import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { User, Mail, Weight, Ruler, Flame, Activity, Lock, Check } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    fitnessLevel: user?.fitnessLevel || 'beginner',
    age: user?.age || '',
    weight: user?.weight || '',
    height: user?.height || '',
    gender: user?.gender || '',
    dailyCalorieTarget: user?.dailyCalorieTarget || 2000,
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passErrors, setPassErrors] = useState({});

  const handleProfileSave = async (ev) => {
    ev.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.patch('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!passForm.currentPassword) e.currentPassword = 'Required';
    if (!passForm.newPassword || passForm.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters';
    if (passForm.newPassword !== passForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (Object.keys(e).length) { setPassErrors(e); return; }
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
    } finally { setPassLoading(false); }
  };

  const bmi = profileForm.weight && profileForm.height
    ? (profileForm.weight / Math.pow(profileForm.height / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Profile</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Manage your personal information and preferences</p>
      </div>

      {/* Avatar + email */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
          style={{ background: 'var(--color-accent)', color: '#000' }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className="text-xl font-bold">{user?.name}</p>
          <div className="flex items-center gap-1.5 mt-1" style={{ color: 'var(--color-text-muted)' }}>
            <Mail size={14} />
            <span className="text-sm">{user?.email}</span>
          </div>
          {bmi && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-accent)' }}>
              BMI: {bmi} (based on your saved measurements)
            </p>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-5">Personal Information</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2 md:col-span-1">
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                <input className="form-input" style={{ paddingLeft: '2.25rem' }}
                  value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Level</label>
              <select className="form-input form-select" value={profileForm.fitnessLevel}
                onChange={e => setProfileForm(p => ({ ...p, fitnessLevel: e.target.value }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input type="number" className="form-input" placeholder="years"
                value={profileForm.age} onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                min="10" max="120" />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <div className="relative">
                <Weight size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                <input type="number" className="form-input" style={{ paddingLeft: '2rem' }}
                  value={profileForm.weight} onChange={e => setProfileForm(p => ({ ...p, weight: e.target.value }))}
                  min="20" max="500" step="0.1" placeholder="kg" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <div className="relative">
                <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                <input type="number" className="form-input" style={{ paddingLeft: '2rem' }}
                  value={profileForm.height} onChange={e => setProfileForm(p => ({ ...p, height: e.target.value }))}
                  min="100" max="250" placeholder="cm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input form-select" value={profileForm.gender}
                onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Daily Calorie Target</label>
              <div className="relative">
                <Flame size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                <input type="number" className="form-input" style={{ paddingLeft: '2rem' }}
                  value={profileForm.dailyCalorieTarget}
                  onChange={e => setProfileForm(p => ({ ...p, dailyCalorieTarget: e.target.value }))}
                  min="500" max="10000" placeholder="2000" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={profileLoading} className="btn btn-primary">
            {profileLoading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Check size={16} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card">
        <h2 className="text-xl font-bold mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
              <input type="password" className={`form-input ${passErrors.currentPassword ? 'error' : ''}`} style={{ paddingLeft: '2.25rem' }}
                value={passForm.currentPassword} onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter your current password" autoComplete="current-password" />
            </div>
            {passErrors.currentPassword && <span className="form-error">{passErrors.currentPassword}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
              <input type="password" className={`form-input ${passErrors.newPassword ? 'error' : ''}`} style={{ paddingLeft: '2.25rem' }}
                value={passForm.newPassword} onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min. 6 characters" autoComplete="new-password" />
            </div>
            {passErrors.newPassword && <span className="form-error">{passErrors.newPassword}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
              <input type="password" className={`form-input ${passErrors.confirmPassword ? 'error' : ''}`} style={{ paddingLeft: '2.25rem' }}
                value={passForm.confirmPassword} onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Repeat new password" autoComplete="new-password" />
            </div>
            {passErrors.confirmPassword && <span className="form-error">{passErrors.confirmPassword}</span>}
          </div>

          <button type="submit" disabled={passLoading} className="btn btn-secondary">
            {passLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock size={15} /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
