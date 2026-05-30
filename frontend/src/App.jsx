import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MedicationsPage from './pages/MedicationsPage';
import RemindersPage from './pages/RemindersPage';
import HistoryPage   from './pages/HistoryPage';
import CaregiverPage from './pages/CaregiverPage';
import ProfilePage   from './pages/ProfilePage';
import AIAssistantPage from './pages/AIAssistantPage';
import Layout        from './components/shared/Layout';

// ─── Protected Route wrapper ──────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Public Route (redirect if already logged in) ─────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />

      {/* Protected — all roles */}
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="medications" element={<MedicationsPage />} />
        <Route path="reminders"   element={<RemindersPage />} />
        <Route path="history"     element={<HistoryPage />} />
        <Route path="caregiver"   element={<CaregiverPage />} />
        <Route path="profile"     element={<ProfilePage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
