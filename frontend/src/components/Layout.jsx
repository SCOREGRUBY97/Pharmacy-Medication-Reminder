import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_DEFS = {
  patient:   [['dashboard','⊞','Dashboard'],['medications','💊','Medications'],['reminders','🔔','Reminders'],['history','📊','History'],['caregiver','👥','My Caregiver'],['ai','🤖','AI Assistant'],['profile','⚙️','Profile']],
  caregiver: [['patients','👥','My Patients'],['alerts','🔔','Alerts'],['reports','📊','Reports'],['link','🔗','Link Patient'],['profile','⚙️','Settings']],
  admin:     [['dashboard','⊞','Dashboard'],['users','👥','Users'],['medications','💊','All Medications'],['reports','📊','Reports'],['audit','🔍','Audit Logs'],['settings','⚙️','Settings']],
};

const COLORS = {
  patient:   { bg: '#052e16', acc: '#16A34A' },
  caregiver: { bg: '#0c1a3d', acc: '#2563EB' },
  admin:     { bg: '#2d0c00', acc: '#DC2626' },
};

export default function Layout({
  // New pattern: page + setPage + children as JSX
  page, setPage, children, pendingCount = 0,
  // Old render-prop pattern used by caregiver/admin
  navItems, sbColor, role: roleProp, userName, userEmail, userInitials,
}) {
  const { user, logout } = useAuth();
  const getDefaultPage = (role) => role === 'caregiver' ? 'patients' : 'dashboard';
  const [localPage, setLocalPage] = useState(() => getDefaultPage(roleProp || 'patient'));

  const role     = roleProp || user?.role || 'patient';
  const clr      = COLORS[role] || COLORS.patient;
  const bg       = sbColor || clr.bg;
  const acc      = clr.acc;
  const initials = userInitials || user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'U';
  const name     = userName || user?.full_name || 'User';
  const email    = userEmail || user?.email || '';

  // Determine which navigation to use
  const isRenderProp = typeof children === 'function';
  const activePage   = isRenderProp ? localPage : (page || localPage);
  const doSetPage    = isRenderProp ? setLocalPage : (setPage || setLocalPage);

  // Build nav items
  let navList = [];
  if (navItems && navItems.length) {
    // Old pattern — navItems is array of {id, label, badge}
    navList = navItems.map(n => ({
      id: n.id, icon: '•', label: n.label, badge: n.badge || 0
    }));
  } else {
    // New pattern — use role-based NAV_DEFS
    navList = (NAV_DEFS[role] || NAV_DEFS.patient).map(([id, icon, label]) => ({
      id, icon, label,
      badge: id === 'reminders' ? pendingCount : 0,
    }));
  }

  // Map old ti-icon to emoji for navItems using ti- icons
  const getIcon = (item) => {
    if (navItems) {
      // Map tabler icon names to emoji
      const map = {
        'ti-users': '👥', 'ti-bell': '🔔', 'ti-chart-bar': '📊', 'ti-user-plus': '🔗',
        'ti-settings': '⚙️', 'ti-layout-dashboard': '⊞', 'ti-pill': '💊',
        'ti-sparkles': '🤖', 'ti-activity': '🔍', 'ti-shield': '🛡️',
      };
      return map[item.icon] || '•';
    }
    return item.icon;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: bg, display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100,
        boxShadow: '2px 0 12px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, background: acc, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>💊</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>MediCare PRO</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'capitalize' }}>{role} portal</div>
            </div>
          </div>
          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: acc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name.split(' ')[0]}</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 600, letterSpacing: 1.2, padding: '4px 2px 8px', textTransform: 'uppercase' }}>Navigation</div>
          {navList.map(item => {
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                onClick={() => doSetPage(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${acc}` : '3px solid transparent',
                  transition: 'all 0.15s', marginBottom: 1,
                }}
                onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}}
                onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{getIcon(item)}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background: '#DC2626', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 20 }}>{item.badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            🚪 Sign out
          </button>
          <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10, marginTop: 6, textAlign: 'center' }}>MediCare PRO v2.0</div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, minWidth: 0, minHeight: '100vh' }}>
        {isRenderProp ? children(activePage) : children}
      </main>
    </div>
  );
}
