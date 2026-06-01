import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PatientApp from './pages/PatientApp';
import CaregiverApp from './pages/CaregiverApp';
import AdminApp from './pages/AdminApp';

function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F3F4F6', fontFamily:'Inter,sans-serif' }}>
      <div>
        <div style={{ width:48, height:48, background:'#0F6E56', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 16px' }}>💊</div>
        <div style={{ textAlign:'center', color:'#6B7280', fontSize:14 }}>Loading MediCare...</div>
      </div>
    </div>
  );

  if (!user) return <Login />;
  if (user.role === 'admin')     return <AdminApp />;
  if (user.role === 'caregiver') return <CaregiverApp />;
  return <PatientApp />;
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
