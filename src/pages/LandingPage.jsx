import { Link } from 'react-router-dom';
import { Zap, Dumbbell, Apple, Target, TrendingUp, Shield, ArrowRight, Check } from 'lucide-react';
import bgImage from '../assets/fitness2.jpg';
import nutritionImage from '../assets/nutrition.jpg';

const features = [
  { icon: Dumbbell, title: 'Workout Tracking', desc: 'Log every set, rep and weight. Build and track custom workout plans with a full exercise library.' },
  { icon: Target, title: 'Goal Setting', desc: 'Set and track fitness goals with progress percentages. Stay motivated with clear milestones.' },
  { icon: Apple, title: 'Nutrition Tracking', desc: 'Log meals and track macros. See daily calorie totals and nutritional summaries.' },
  { icon: TrendingUp, title: 'Progress Analytics', desc: 'Visualize your fitness journey with weekly and monthly charts based on your real data.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data belongs to you. Secure authentication ensures complete privacy.' },
  { icon: Zap, title: 'Smart Dashboard', desc: 'All your key stats at a glance. Real numbers from your actual activity.' },
];

const programs = [
  { title: 'Strength Training', desc: 'Build foundational power and perfect your form.', level: 'Beginner', duration: '8 weeks', color: '#10b981' },
  { title: 'Fat Loss Challenge', desc: 'High intensity sessions to shred fat effectively.', level: 'Intermediate', duration: '6 weeks', color: '#3b82f6' },
  { title: 'Flexibility & Mobility', desc: 'Recover faster and stay injury-free with guided stretching.', level: 'Beginner', duration: '4 weeks', color: '#8b5cf6' },
  { title: 'Cardio Blast', desc: 'Boost your heart health with interval training routines.', level: 'Advanced', duration: '5 weeks', color: '#f59e0b' },
];

const nutritionTips = [
  { title: 'Hydration', desc: 'Drink at least 2–3 liters of water daily to optimize performance.' },
  { title: 'Whole Foods', desc: 'Prioritize natural, unprocessed foods for maximum nutrients.' },
  { title: 'Protein Intake', desc: 'Include lean protein in every meal to support muscle recovery.' },
  { title: 'Balanced Meals', desc: 'Combine carbs, protein and fats for stable energy all day.' },
  { title: 'Limit Sugar', desc: 'Cut down on added sugars to improve energy stability.' },
];

const LandingPage = () => {
  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      {/* ── Navbar ── */}
      <header className="fixed top-0 w-full z-30" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--color-border)' }}>
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Zap size={16} className="text-black" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FitLife</span>
          </div>

          <ul className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            <li><a href="#features" className="hover:text-white transition">Features</a></li>
            <li><a href="#programs" className="hover:text-white transition">Programs</a></li>
            <li><a href="#nutrition" className="hover:text-white transition">Nutrition</a></li>
            <li><a href="#bmi" className="hover:text-white transition">BMI</a></li>
          </ul>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center pt-20"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.6) 100%)' }} />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ background: 'var(--color-accent-dim)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-accent)' }}>
            <Zap size={14} /> Your personalized fitness platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Welcome to <span className="gradient-text">FitLife</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(240,240,245,0.75)' }}>
            Train smarter. Track everything. <br />Transform your body and your life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start for Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Explore Features
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            {[
              { value: '40+', label: 'Exercises' },
              { value: '4', label: 'Workout Types' },
              { value: '100%', label: 'Free to Start' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black gradient-text">{value}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Everything you need to <span className="gradient-text">succeed</span></h2>
            <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>A complete fitness platform built for serious athletes and beginners alike.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover-lift group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all"
                  style={{ background: 'var(--color-accent-dim)' }}>
                  <Icon size={22} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs ── */}
      <section id="programs" className="py-24 px-6" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Curated <span className="gradient-text">Programs</span></h2>
            <p style={{ color: 'var(--color-text-muted)' }}>Reference workout programs to guide your training. Log your own workouts once you sign up.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map((prog) => (
              <div key={prog.title} className="card hover-lift" style={{ borderLeft: `3px solid ${prog.color}` }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold">{prog.title}</h3>
                  <span className="badge" style={{ background: `${prog.color}20`, color: prog.color }}>
                    {prog.level}
                  </span>
                </div>
                <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>{prog.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>⏱ {prog.duration}</span>
                  <Link to="/register" className="btn btn-primary btn-sm">Start Program</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nutrition ── */}
      <section id="nutrition" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black mb-4">Fuel your <span className="gradient-text">performance</span></h2>
              <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
                Good nutrition is the foundation of every transformation. Log your meals and track macros with FitLife.
              </p>
              <div className="space-y-4">
                {nutritionTips.map((tip) => (
                  <div key={tip.title} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--color-accent-dim)' }}>
                      <Check size={12} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{tip.title}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn btn-primary mt-8">Start Tracking Nutrition</Link>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <img src={nutritionImage} alt="Healthy nutrition food" className="w-full object-cover" style={{ maxHeight: '420px' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── BMI Calculator ── */}
      <BMISection />

      {/* ── CTA ── */}
      <section className="py-24 px-6" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Ready to <span className="gradient-text">transform</span>?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Create your free account and start tracking your fitness journey today.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 text-center text-sm border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Zap size={10} className="text-black" />
          </div>
          <span className="font-bold text-white">FitLife</span>
        </div>
        <p>© 2025 FitLife. All rights reserved. — Personalized Fitness & Wellness Platform</p>
      </footer>
    </div>
  );
};

// BMI Calculator as separate inline component
import { useState } from 'react';

const BMISection = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState('');
  const [catColor, setCatColor] = useState('');

  const calculateBMI = () => {
    if (!weight || !height || Number(weight) <= 0 || Number(height) <= 0) return;
    const h = Number(height) / 100;
    const val = (Number(weight) / (h * h)).toFixed(1);
    setBmi(val);
    if (val < 18.5) { setCategory('Underweight'); setCatColor('#3b82f6'); }
    else if (val < 25) { setCategory('Normal weight'); setCatColor('#10b981'); }
    else if (val < 30) { setCategory('Overweight'); setCatColor('#f59e0b'); }
    else { setCategory('Obese'); setCatColor('#ef4444'); }
  };

  const pct = bmi ? Math.min(((bmi - 10) / 30) * 100, 100) : 0;

  return (
    <section id="bmi" className="py-24 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black mb-3">BMI <span className="gradient-text">Calculator</span></h2>
          <p style={{ color: 'var(--color-text-muted)' }}>A quick reference tool. Consult a healthcare professional for personalized advice.</p>
        </div>
        <div className="card">
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 70" className="form-input" min="1" max="500" />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                placeholder="e.g. 175" className="form-input" min="50" max="300" />
            </div>
            <button onClick={calculateBMI} className="btn btn-primary w-full" style={{ width: '100%' }}>
              Calculate BMI
            </button>
          </div>

          {bmi && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Your BMI</p>
                  <p className="text-4xl font-black">{bmi}</p>
                </div>
                <span className="badge text-sm" style={{ background: `${catColor}20`, color: catColor, fontSize: '0.875rem', padding: '0.35rem 0.85rem' }}>
                  {category}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #ef4444)` }} />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
