import { useAuth } from '../context/AuthContext';

const COLORS = { primary: '#0F6E56', danger: '#E24B4A', dangerLight: '#FCEBEB', border: '#D3D1C7', muted: '#5F5E5A' };

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Profile & Settings</h1>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 18px' }}>Manage your account and preferences</p>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1.5 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Personal Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SJ'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name || 'Sarah Johnson'}</div>
                <div style={{ color: COLORS.muted, fontSize: 13 }}>{user?.email || 'sarah@example.com'}</div>
                <span style={{ background: '#E1F5EE', color: COLORS.primary, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{user?.role || 'patient'}</span>
              </div>
            </div>
            {[['Full Name', user?.name || 'Sarah Johnson'], ['Email', user?.email || 'sarah@example.com'], ['Role', user?.role || 'patient'], ['Member Since', 'April 2026']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                <span style={{ color: COLORS.muted }}>{k}</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px', marginBottom: 12 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Notifications</h3>
            {[['Email reminders', true], ['SMS alerts', false], ['Push notifications', true], ['Missed dose alerts', true], ['Weekly summary', true]].map(([label, on]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <div style={{ width: 32, height: 18, borderRadius: 9, background: on ? COLORS.primary : COLORS.border, position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Account</h3>
            <button style={{ width: '100%', padding: 9, borderRadius: 8, border: 'none', cursor: 'pointer', background: COLORS.primary, color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Change Password</button>
            <button onClick={logout} style={{ width: '100%', padding: 9, borderRadius: 8, border: 'none', cursor: 'pointer', background: COLORS.dangerLight, color: COLORS.danger, fontSize: 13, fontWeight: 600 }}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
