import { useState, useEffect } from 'react';
import { C } from '../constants/styles';
import { getNotifications, markNotifRead, markAllRead } from '../services/api';
import { subscribeToPush, savePushSubscription, getNotificationStatus } from '../services/pushNotifications';

export default function NotificationBell({ sbColor }) {
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState([]);
  const [perm, setPerm]       = useState(getNotificationStatus());
  const [loading, setLoading] = useState(false);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifs = async () => {
    try { const r = await getNotifications(); setNotifs(r.data); } catch {}
  };

  const enablePush = async () => {
    setLoading(true);
    try {
      const sub = await subscribeToPush();
      if (sub) { await savePushSubscription(sub); setPerm('granted'); }
    } finally { setLoading(false); }
  };

  const markRead = async (id) => {
    await markNotifRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAll = async () => {
    await markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const iconMap = { reminder: 'ti-pill', missed: 'ti-alert-triangle', caregiver_alert: 'ti-users', streak: 'ti-flame', welcome: 'ti-sparkles', refill: 'ti-refresh' };
  const colorMap = { reminder: C.pri, missed: C.dan, caregiver_alert: C.wrn, streak: C.acc, welcome: C.inf, refill: C.wrn };
  const timeAgo = d => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`; };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} aria-label="Notifications"
        style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.brd}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mut }}>
        <i className="ti ti-bell" style={{ fontSize: 18 }} aria-hidden="true" />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: C.dan, color: '#fff', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F0F4F2' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: '#fff', borderRadius: 16, border: `1px solid ${C.brd}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 500, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${C.brd}` }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Notifications {unread > 0 && <span style={{ background: C.dan, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 20, marginLeft: 6 }}>{unread}</span>}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {unread > 0 && <button onClick={markAll} style={{ fontSize: 11, color: C.pri, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mut }}><i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" /></button>
            </div>
          </div>

          {/* Enable push banner */}
          {perm !== 'granted' && (
            <div style={{ padding: '12px 16px', background: '#EEF9F5', borderBottom: `1px solid #C0EAD9` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-device-laptop" style={{ color: C.pri, fontSize: 22 }} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.priDk }}>Enable laptop notifications</div>
                  <div style={{ fontSize: 11, color: C.pri }}>Get reminders like Facebook & Instagram — even when browser is closed</div>
                </div>
                <button onClick={enablePush} disabled={loading}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: C.pri, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  {loading ? '...' : 'Allow'}
                </button>
              </div>
            </div>
          )}
          {perm === 'granted' && (
            <div style={{ padding: '8px 16px', background: '#EEF9F5', borderBottom: `1px solid #C0EAD9`, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: C.suc }}>
              <i className="ti ti-circle-check" style={{ fontSize: 14 }} aria-hidden="true" />
              Laptop notifications active — you'll get alerts like Facebook
            </div>
          )}

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <i className="ti ti-bell-off" style={{ fontSize: 36, color: C.brd, display: 'block', marginBottom: 8 }} aria-hidden="true" />
                <div style={{ fontSize: 13, color: C.mut }}>No notifications yet</div>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                style={{ display: 'flex', gap: 11, padding: '12px 16px', borderBottom: `1px solid #f5f5f5`, background: n.is_read ? '#fff' : '#F8FFFE', cursor: 'pointer', transition: 'background 0.1s' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: colorMap[n.type] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${iconMap[n.type] || 'ti-bell'}`} style={{ color: colorMap[n.type] || C.pri, fontSize: 15 }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 700, color: C.txt, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: C.brd, marginTop: 3 }}>{timeAgo(n.sent_at)}</div>
                </div>
                {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.pri, flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>

          {perm === 'granted' && (
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.brd}`, fontSize: 11, color: C.suc, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-wifi" style={{ fontSize: 13 }} aria-hidden="true" /> Real-time push active on this device
            </div>
          )}
        </div>
      )}
    </div>
  );
}
