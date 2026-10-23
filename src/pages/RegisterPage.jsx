import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, User, Mail, Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    fitnessLevel: 'beginner',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const { name, email, password, fitnessLevel } = form;
      await register({ name, email, password, fitnessLevel });
      toast.success('Account created! Welcome to FitLife 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = passwordStrength();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#10b981'][strength];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Zap size={18} className="text-black" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FitLife</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Start your fitness journey today — it's free</p>
        </div>

        <div className="card">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <AlertCircle size={15} />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                  <input id="name" type="text" autoComplete="name"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem' }} placeholder="John Doe" />
                </div>
                {errors.name && <span className="form-error"><AlertCircle size={12} />{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                  <input id="reg-email" type="email" autoComplete="email"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem' }} placeholder="you@example.com" />
                </div>
                {errors.email && <span className="form-error"><AlertCircle size={12} />{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{ background: i <= strength ? strengthColor : 'var(--color-border)' }} />
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{ color: strengthColor }}>{strengthLabel}</p>
                  </div>
                )}
                {errors.password && <span className="form-error"><AlertCircle size={12} />{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }} placeholder="••••••••" />
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#10b981' }} />
                  )}
                </div>
                {errors.confirmPassword && <span className="form-error"><AlertCircle size={12} />{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fitnessLevel" className="form-label">Fitness Level</label>
                <select id="fitnessLevel" value={form.fitnessLevel}
                  onChange={e => setForm(p => ({ ...p, fitnessLevel: e.target.value }))}
                  className="form-input form-select">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
