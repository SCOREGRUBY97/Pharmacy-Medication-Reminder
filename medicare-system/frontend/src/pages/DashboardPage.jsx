import { useDashboard } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { reminderAPI } from '../services/api';
import { useState } from 'react';

const C = { primary: '#0F6E56', success: '#639922', danger: '#E24B4A', warning: '#BA7517', info: '#378ADD', textMuted: '#5F5E5A', border: '#D3D1C7' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboard();
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  const markStatus = async (id, status) => {
    try {
      await reminderAPI.updateStatus(id, { status });
      showToast(status === 'taken' ? '✓ Medication marked as taken!' : '✗ Dose marked as missed.');
      refetch();
    } catch { showToast('Failed to update status.'); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Loading dashboard...</div>;
  if (error)   return <div style={{ padding: 40, color: C.danger }}>{error}</div>;

  const { today, week_stats = [], total_medications } = data || {};
  const { taken = 0, missed = 0, pending = 0, total = 0, adherence_pct = 0, reminders = [], date } = today || {};

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#085041', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 300 }}>
          {toastMsg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{greeting}, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p style={{ color: C.textMuted, fontSize: 14, margin: '4px 0 0' }}>{date} — Your medication overview for today</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: "Today's Doses", val: total,   color: C.info,    bg: '#E6F1FB' },
          { label: 'Taken',         val: taken,   color: C.success, bg: '#EAF3DE' },
          { label: 'Missed',        val: missed,  color: C.danger,  bg: '#FCEBEB' },
          { label: 'Pending',       val: pending, color: C.warning, bg: '#FAEEDA' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0 }}>{s.val}</p>
            <p style={{ fontSize: 13, color: C.textMuted, margin: '2px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Reminders list */}
        <div style={{ flex: 2, background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Today's Reminders</h3>
            <span style={{ background: '#E1F5EE', color: C.primary, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{adherence_pct}% adherence</span>
          </div>

          {reminders.length === 0 && <p style={{ color: C.textMuted, fontSize: 14 }}>No reminders for today.</p>}

          {reminders.map(r => (
            <div key={r.reminder_id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, marginBottom: 10,
              background: r.status === 'taken' ? '#EAF3DE' : r.status === 'missed' ? '#FCEBEB' : '#FAEEDA',
              borderLeft: `4px solid ${r.status === 'taken' ? C.success : r.status === 'missed' ? C.danger : C.warning}`
            }}>
              <div style={{ fontSize: 22 }}>💊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.medication_name} {r.dosage}</div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>Scheduled: {r.reminder_time?.slice(0, 5)} · {r.instructions}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.status === 'taken' ? C.success : r.status === 'missed' ? C.danger : C.warning, color: '#fff' }}>
                {r.status?.toUpperCase()}
              </span>
              {(r.status === 'pending' || r.status === 'sent') && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: C.success, color: '#fff' }} onClick={() => markStatus(r.reminder_id, 'taken')}>Taken</button>
                  <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: C.danger, color: '#fff' }} onClick={() => markStatus(r.reminder_id, 'missed')}>Missed</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Adherence Progress</h3>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: adherence_pct > 70 ? C.success : C.danger }}>{adherence_pct}%</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>Today's adherence</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${adherence_pct}%`, background: adherence_pct > 70 ? C.success : C.danger, borderRadius: 4 }} />
            </div>
            <div style={{ marginTop: 16, fontSize: 13 }}>
              {[['Total medications', total_medications || 0], ['Today\'s reminders', total], ['Taken today', taken]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted }}>{k}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day mini chart */}
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>7-Day Overview</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 70 }}>
              {week_stats.slice(0, 7).reverse().map(d => {
                const pct = d.total > 0 ? Math.round((d.taken / d.total) * 100) : 0;
                const day = new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short' });
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 10, color: pct > 75 ? C.success : C.danger, fontWeight: 700 }}>{pct}%</span>
                    <div style={{ width: '100%', height: 50, background: C.border, borderRadius: 4, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: `${pct}%`, background: pct > 75 ? C.success : pct > 50 ? C.warning : C.danger }} />
                    </div>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
