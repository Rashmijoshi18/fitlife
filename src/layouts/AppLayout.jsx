import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Dumbbell, Target, Apple, BookOpen, User,
  LogOut, Menu, X, Zap, ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workouts', label: 'Workouts', icon: Dumbbell },
  { path: '/exercises', label: 'Exercises', icon: BookOpen },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/nutrition', label: 'Nutrition', icon: Apple },
  { path: '/profile', label: 'Profile', icon: User },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
          <Zap size={16} className="text-black" />
        </div>
        <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          FitLife
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'var(--color-accent-dim)' : 'transparent',
                color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              <Icon size={17} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--color-surface-2)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--color-accent)', color: '#000' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 border-r"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      )}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col md:hidden transition-transform duration-300"
        style={{
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ color: 'var(--color-text-muted)' }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Zap size={12} className="text-black" />
            </div>
            <span className="font-bold text-sm">FitLife</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
