import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Zap size={18} className="text-black" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FitLife</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Sign in to your account</p>
        </div>

        {/* Form */}
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
                <label htmlFor="email" className="form-label">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <span className="form-error"><AlertCircle size={12} />{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-subtle)' }} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error"><AlertCircle size={12} />{errors.password}</span>}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }} />
                </div>
                <span className="relative px-2 text-xs uppercase" style={{ background: 'var(--color-surface)', color: 'var(--color-text-subtle)' }}>
                  Or instant access
                </span>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setErrors({});
                  try {
                    await login('rashmijoshi3699@gmail.com', 'Rashmi@3699');
                    toast.success('Welcome to FitLife Demo! 🎉');
                    navigate('/dashboard');
                  } catch (err) {
                    setErrors({ general: err.response?.data?.error || 'Demo login failed' });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                style={{ width: '100%', borderColor: 'var(--color-accent)' }}
              >
                <Zap size={15} style={{ color: 'var(--color-accent)' }} />
                <span>One-Click Demo Access</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 p-3 rounded-xl text-center text-xs" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Demo Account: </span>
          <span className="font-mono text-emerald-400">rashmijoshi3699@gmail.com</span>
          <span style={{ color: 'var(--color-text-subtle)' }}> · </span>
          <span className="font-mono text-emerald-400">Rashmi@3699</span>
        </div>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: '600' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
