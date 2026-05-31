import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import PatientApp from './pages/patient/PatientApp';
import CaregiverApp from './pages/caregiver/CaregiverApp';
import AdminApp from './pages/admin/AdminApp';
import { registerServiceWorker } from './services/pushNotifications';

function AppRouter() {
  const { user, loading } = useAuth();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💊</div>
        <div style={{ fontSize: 14, color: '#5F5E5A' }}>Loading MediCare...</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;
  if (user.role === 'patient')   return <PatientApp />;
  if (user.role === 'caregiver') return <CaregiverApp />;
  if (user.role === 'admin')     return <AdminApp />;
  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
