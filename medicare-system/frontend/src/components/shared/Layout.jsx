import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard',   label: 'Dashboard',       icon: '⊞' },
  { path: '/medications', label: 'My Medications',   icon: '💊' },
  { path: '/reminders',   label: 'Reminders',        icon: '🔔' },
  { path: '/history',     label: 'History & Reports',icon: '📊' },
  { path: '/caregiver',   label: 'Caregiver',        icon: '👥' },
  { path: '/ai-assistant', label: 'AI Assistant',     icon: '🤖' },
  { path: '/profile',     label: 'Profile & Settings',icon: '⚙' },
];

const sidebarStyle = {
  width: 240, background: '#085041', minHeight: '100vh',
  position: 'fixed', left: 0, top: 0, bottom: 0,
  display: 'flex', flexDirection: 'column',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', fontFamily: "'Nunito', sans-serif" }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#EF9F27', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💊</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>MediCare</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Reminder System</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{initials}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{user?.full_name?.split(' ')[0]}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '8px 20px 4px', textTransform: 'uppercase' }}>Main Menu</div>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid #EF9F27' : '3px solid transparent',
            })}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, width: '100%', textAlign: 'left' }}>
            ↩ Sign Out
          </button>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>MediCare v1.0 · 2026</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minHeight: '100vh', background: '#F7FAF8' }}>
        <Outlet />
      </main>
    </div>
  );
}
