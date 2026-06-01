import { useAuth } from '../context/AuthContext';

const COLORS = { primary: '#0F6E56', danger: '#E24B4A', dangerLight: '#FCEBEB', info: '#378ADD', infoLight: '#E6F1FB', success: '#639922', successLight: '#EAF3DE', warning: '#BA7517', warningLight: '#FAEEDA', muted: '#5F5E5A', border: '#D3D1C7' };

const REMINDERS = [
  { id: 1, name: 'Metformin 500mg', time: '08:00', status: 'taken' },
  { id: 2, name: 'Amlodipine 5mg', time: '08:00', status: 'taken' },
  { id: 3, name: 'Vitamin D3 1000IU', time: '13:00', status: 'missed' },
  { id: 4, name: 'Atorvastatin 20mg', time: '21:00', status: 'pending' },
  { id: 5, name: 'Metformin 500mg', time: '20:00', status: 'pending' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const taken = REMINDERS.filter(r => r.status === 'taken').length;
  const missed = REMINDERS.filter(r => r.status === 'missed').length;
  const pending = REMINDERS.filter(r => r.status === 'pending').length;
  const pct = Math.round((taken / REMINDERS.length) * 100);

  const card = (color, bg, val, label) => (
    <div style={{ background: bg, borderRadius: 12, padding: '14px 18px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{val}</div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Good morning, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 18px' }}>Here's your medication overview for today</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        {card(COLORS.info, COLORS.infoLight, REMINDERS.length, "Today's Doses")}
        {card(COLORS.success, COLORS.successLight, taken, 'Taken')}
        {card(COLORS.danger, COLORS.dangerLight, missed, 'Missed')}
        {card(COLORS.warning, COLORS.warningLight, pending, 'Pending')}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2, background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Today's Reminders</h3>
            <span style={{ background: '#E1F5EE', color: COLORS.primary, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pct}% adherence</span>
          </div>
          {REMINDERS.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: r.status === 'taken' ? COLORS.successLight : r.status === 'missed' ? COLORS.dangerLight : COLORS.warningLight, borderRadius: 10, marginBottom: 8, borderLeft: `4px solid ${r.status === 'taken' ? COLORS.success : r.status === 'missed' ? COLORS.danger : COLORS.warning}` }}>
              <span style={{ fontSize: 20 }}>💊</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                <div style={{ color: COLORS.muted, fontSize: 11 }}>Scheduled: {r.time}</div>
              </div>
              <span style={{ background: r.status === 'taken' ? COLORS.success : r.status === 'missed' ? COLORS.danger : COLORS.warning, color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{r.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 20px', marginBottom: 12 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Adherence Progress</h3>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: pct > 70 ? COLORS.success : COLORS.danger }}>{pct}%</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Today's adherence</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: COLORS.border, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: pct > 70 ? COLORS.success : COLORS.danger, borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
