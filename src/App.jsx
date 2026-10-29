import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected app pages
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import WorkoutsPage from './pages/WorkoutsPage';
import AchievementsPage from './pages/AchievementsPage';
import NutritionPage from './pages/NutritionPage';
import ProfilePage from './pages/ProfilePage';
import WorkoutStudioPage from './pages/WorkoutStudioPage';
import AiCoachPage from './pages/AiCoachPage';
import WeeklyPlannerPage from './pages/WeeklyPlannerPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Protected — inside app shell */}
    <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/workout-studio" element={<ProtectedRoute><AppLayout><WorkoutStudioPage /></AppLayout></ProtectedRoute>} />
    <Route path="/ai-coach" element={<ProtectedRoute><AppLayout><AiCoachPage /></AppLayout></ProtectedRoute>} />
    <Route path="/weekly-planner" element={<ProtectedRoute><AppLayout><WeeklyPlannerPage /></AppLayout></ProtectedRoute>} />
    <Route path="/workouts" element={<ProtectedRoute><AppLayout><WorkoutsPage /></AppLayout></ProtectedRoute>} />
    <Route path="/exercises" element={<Navigate to="/workouts" replace />} />
    <Route path="/achievements" element={<ProtectedRoute><AppLayout><AchievementsPage /></AppLayout></ProtectedRoute>} />
    <Route path="/goals" element={<Navigate to="/achievements" replace />} />
    <Route path="/nutrition" element={<ProtectedRoute><AppLayout><NutritionPage /></AppLayout></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #10b981',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          duration: 3500,
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
