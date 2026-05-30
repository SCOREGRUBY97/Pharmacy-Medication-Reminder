// ============================================================
// RemindersPage.jsx
// ============================================================
import { useReminders } from '../hooks/useApi';

const C = { success: '#639922', danger: '#E24B4A', warning: '#BA7517', textMuted: '#5F5E5A', border: '#D3D1C7' };

export function RemindersPage() {
  const { reminders, loading, error, markStatus } = useReminders();
  const groups = { pending: [], sent: [], taken: [], missed: [] };
  reminders.forEach(r => { if (groups[r.status]) groups[r.status].push(r); });
  const allPending = [...groups.pending, ...groups.sent];

  const statusColor = (s) => s === 'taken' ? C.success : s === 'missed' ? C.danger : C.warning;
  const statusBg    = (s) => s === 'taken' ? '#EAF3DE'  : s === 'missed' ? '#FCEBEB'  : '#FAEEDA';

  if (loading) return <div style={{ padding: 40, color: C.textMuted }}>Loading reminders...</div>;
  if (error)   return <div style={{ padding: 40, color: C.danger }}>{error}</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Reminders</h1>
      <p style={{ color: C.textMuted, fontSize: 14, margin: '0 0 24px' }}>Today's medication schedule — {reminders.length} total reminders</p>

      {[
        { label: '⏳ Pending', list: allPending },
        { label: '✓ Taken',   list: groups.taken },
        { label: '✗ Missed',  list: groups.missed },
      ].map(({ label, list }) => (
        <div key={label} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>{label} ({list.length})</h3>
          {list.length === 0
            ? <p style={{ color: C.textMuted, fontSize: 13 }}>None</p>
            : list.map(r => (
              <div key={r.reminder_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: statusBg(r.status), borderRadius: 10, marginBottom: 10, borderLeft: `4px solid ${statusColor(r.status)}` }}>
                <div style={{ fontSize: 22 }}>💊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.medication_name} {r.dosage}</div>
                  <div style={{ color: C.textMuted, fontSize: 12 }}>Scheduled: {r.reminder_time?.slice(0,5)} · {r.reminder_date}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusColor(r.status), color: '#fff' }}>{r.status?.toUpperCase()}</span>
                {(r.status === 'pending' || r.status === 'sent') && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: C.success, color: '#fff' }} onClick={() => markStatus(r.reminder_id, 'taken')}>Mark Taken</button>
                    <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: C.danger, color: '#fff' }} onClick={() => markStatus(r.reminder_id, 'missed')}>Mark Missed</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// HistoryPage.jsx
// ============================================================
import { useAdherence } from '../hooks/useApi';
import { useState as useS } from 'react';

export function HistoryPage() {
  const [days, setDays] = useS(7);
  const { data: summary = [], loading, error } = useAdherence(days);

  const overall = summary.length > 0
    ? Math.round(summary.reduce((s, d) => s + (d.adherence_pct || 0), 0) / summary.length)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>History & Reports</h1>
          <p style={{ color: '#5F5E5A', fontSize: 14, margin: '4px 0 0' }}>Medication adherence over the past {days} days</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D3D1C7', fontSize: 13 }}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {loading && <p style={{ color: '#5F5E5A' }}>Loading history...</p>}
      {error   && <p style={{ color: '#E24B4A' }}>{error}</p>}

      {summary.length > 0 && (
        <>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D3D1C7', padding: '20px 24px', marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Adherence Chart</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 100 }}>
              {[...summary].reverse().map(d => {
                const pct = d.adherence_pct || 0;
                const day = new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: pct > 75 ? '#639922' : '#E24B4A' }}>{pct}%</span>
                    <div style={{ width: '100%', height: 70, background: '#D3D1C7', borderRadius: 4, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: `${pct}%`, background: pct > 75 ? '#639922' : pct > 50 ? '#BA7517' : '#E24B4A' }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#5F5E5A', textAlign: 'center' }}>{day}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F6E56' }}>Average: {overall}%</span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D3D1C7', padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Daily Log</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  {['Date', 'Total', 'Taken', 'Missed', 'Pending', 'Adherence'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#5F5E5A', borderBottom: '1px solid #D3D1C7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map(d => (
                  <tr key={d.date} style={{ borderBottom: '1px solid #D3D1C7' }}>
                    <td style={{ padding: '10px 12px' }}>{new Date(d.date).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</td>
                    <td style={{ padding: '10px 12px' }}>{d.total}</td>
                    <td style={{ padding: '10px 12px', color: '#639922', fontWeight: 600 }}>{d.taken}</td>
                    <td style={{ padding: '10px 12px', color: '#E24B4A', fontWeight: 600 }}>{d.missed}</td>
                    <td style={{ padding: '10px 12px', color: '#BA7517', fontWeight: 600 }}>{d.pending}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: d.adherence_pct > 75 ? '#EAF3DE' : '#FCEBEB', color: d.adherence_pct > 75 ? '#639922' : '#E24B4A' }}>{d.adherence_pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// CaregiverPage.jsx
// ============================================================
import { useCaregivers } from '../hooks/useApi';
import { useState as useCS } from 'react';

export function CaregiverPage() {
  const { caregivers, loading, link, remove } = useCaregivers();
  const [form, setForm] = useCS({ caregiver_name: '', caregiver_email: '', caregiver_phone: '', relationship: '' });
  const [saving, setSaving] = useCS(false);
  const [toast, setToast] = useCS('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLink = async () => {
    if (!form.caregiver_name || !form.caregiver_email) return;
    setSaving(true);
    try { await link(form); showToast('Caregiver linked!'); setForm({ caregiver_name: '', caregiver_email: '', caregiver_phone: '', relationship: '' }); }
    catch (e) { showToast(e.response?.data?.message || 'Failed to link caregiver.'); }
    setSaving(false);
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D3D1C7', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#085041', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 300 }}>{toast}</div>}
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Caregiver Support</h1>
      <p style={{ color: '#5F5E5A', fontSize: 14, margin: '0 0 24px' }}>Link caregivers to monitor your medication adherence</p>

      {/* Linked caregivers */}
      {!loading && caregivers.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D3D1C7', padding: '20px 24px', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Linked Caregivers</h3>
          {caregivers.map(c => (
            <div key={c.caregiver_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#EAF3DE', borderRadius: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                {c.caregiver_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{c.caregiver_name}</div>
                <div style={{ color: '#5F5E5A', fontSize: 13 }}>{c.caregiver_email} · {c.relationship}</div>
              </div>
              <button onClick={() => remove(c.caregiver_id)} style={{ padding: '5px 12px', background: '#E24B4A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* Add caregiver form */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D3D1C7', padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Link a New Caregiver</h3>
        {[
          { k: 'caregiver_name',  l: 'Full Name',    ph: 'Mary Johnson' },
          { k: 'caregiver_email', l: 'Email',         ph: 'caregiver@example.com' },
          { k: 'caregiver_phone', l: 'Phone',         ph: '+61 400 000 000' },
          { k: 'relationship',    l: 'Relationship',  ph: 'Daughter, Nurse, Friend...' },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5F5E5A', display: 'block', marginBottom: 6 }}>{f.l}</label>
            <input style={inp} placeholder={f.ph} value={form[f.k]} onChange={e => set(f.k, e.target.value)} />
          </div>
        ))}
        <button onClick={handleLink} disabled={saving} style={{ padding: '9px 18px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {saving ? 'Linking...' : 'Link Caregiver'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ProfilePage.jsx
// ============================================================
import { useAuth as useAuthP } from '../context/AuthContext';
import { useNavigate as useNav } from 'react-router-dom';

export function ProfilePage() {
  const { user, logout } = useAuthP();
  const navigate = useNav();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Profile & Settings</h1>
      <p style={{ color: '#5F5E5A', fontSize: 14, margin: '0 0 24px' }}>Manage your account and preferences</p>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 2, background: '#fff', borderRadius: 14, border: '1px solid #D3D1C7', padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Personal Information</h3>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
              {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.full_name}</div>
              <div style={{ color: '#5F5E5A', fontSize: 13 }}>{user?.email}</div>
            </div>
          </div>
          {[['Full Name', user?.full_name], ['Email', user?.email], ['Role', user?.role]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #D3D1C7', fontSize: 13 }}>
              <span style={{ color: '#5F5E5A' }}>{k}</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D3D1C7', padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Account Actions</h3>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#E24B4A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
