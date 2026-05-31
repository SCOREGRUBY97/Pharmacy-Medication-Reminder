import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/medications', label: 'Medications', icon: '💊' },
  { path: '/reminders', label: 'Reminders', icon: '🔔' },
  { path: '/history', label: 'History', icon: '📊' },
  { path: '/caregiver', label: 'Caregiver', icon: '👥' },
  { path: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { path: '/profile', label: 'Profile', icon: '⚙' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7FAF8', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ width: 220, background: '#085041', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#EF9F27', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💊</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Pharmacy Reminder</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>Medication System</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SJ'}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{user?.name?.split(' ')[0] || 'User'}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textTransform: 'capitalize' }}>{user?.role || 'patient'}</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '8px 0', flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '6px 16px 4px', textTransform: 'uppercase' }}>Main Menu</div>
          {NAV.map(({ path, label, icon }) => {
            const active = pathname === path;
            return (
              <div key={path} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.12)' : 'transparent', borderLeft: active ? '3px solid #EF9F27' : '3px solid transparent', color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: active ? 600 : 400 }}>
                <span>{icon}</span> {label}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>MediCare v1.0 · 2026</div>
      </div>
      <main style={{ marginLeft: 220, flex: 1, padding: '24px 28px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
