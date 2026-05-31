import { useState } from 'react';

const COLORS = { success: '#639922', successLight: '#EAF3DE', danger: '#E24B4A', dangerLight: '#FCEBEB', warning: '#BA7517', warningLight: '#FAEEDA', muted: '#5F5E5A', border: '#D3D1C7' };
const INIT = [
  { id: 1, name: 'Metformin 500mg', time: '08:00', status: 'taken', date: '2026-05-07' },
  { id: 2, name: 'Amlodipine 5mg', time: '08:00', status: 'taken', date: '2026-05-07' },
  { id: 3, name: 'Vitamin D3 1000IU', time: '13:00', status: 'missed', date: '2026-05-07' },
  { id: 4, name: 'Atorvastatin 20mg', time: '21:00', status: 'pending', date: '2026-05-07' },
  { id: 5, name: 'Metformin 500mg', time: '20:00', status: 'pending', date: '2026-05-07' },
];

export default function RemindersPage() {
  const [rems, setRems] = useState(INIT);
  const mark = (id, status) => setRems(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  const groups = [['pending', '⏳ Pending'], ['taken', '✓ Taken'], ['missed', '✗ Missed']];
  const col = s => s === 'taken' ? COLORS.success : s === 'missed' ? COLORS.danger : COLORS.warning;
  const bg = s => s === 'taken' ? COLORS.successLight : s === 'missed' ? COLORS.dangerLight : COLORS.warningLight;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Reminders</h1>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 18px' }}>{rems.length} total reminders today</p>
      {groups.map(([status, label]) => {
        const list = rems.filter(r => r.status === status);
        return (
          <div key={status} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, margin: '0 0 8px' }}>{label} ({list.length})</h3>
            {list.length === 0 ? <p style={{ color: COLORS.muted, fontSize: 13 }}>None</p> : list.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: bg(r.status), borderRadius: 10, marginBottom: 8, borderLeft: `4px solid ${col(r.status)}` }}>
                <span style={{ fontSize: 18 }}>💊</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  <div style={{ color: COLORS.muted, fontSize: 11 }}>Scheduled: {r.time} · {r.date}</div>
                </div>
                <span style={{ background: col(r.status), color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{r.status.toUpperCase()}</span>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => mark(r.id, 'taken')} style={{ padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', background: COLORS.success, color: '#fff', fontSize: 11, fontWeight: 600 }}>Taken</button>
                    <button onClick={() => mark(r.id, 'missed')} style={{ padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', background: COLORS.danger, color: '#fff', fontSize: 11, fontWeight: 600 }}>Missed</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
