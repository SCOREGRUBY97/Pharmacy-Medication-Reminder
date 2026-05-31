const COLORS = { primary: '#0F6E56', success: '#639922', successLight: '#EAF3DE', danger: '#E24B4A', dangerLight: '#FCEBEB', warning: '#BA7517', warningLight: '#FAEEDA', accent: '#EF9F27', muted: '#5F5E5A', border: '#D3D1C7' };
const HIST = [
  { date: '2026-05-06', d: 'May 6', taken: 4, missed: 0, total: 4 },
  { date: '2026-05-05', d: 'May 5', taken: 3, missed: 1, total: 4 },
  { date: '2026-05-04', d: 'May 4', taken: 4, missed: 0, total: 4 },
  { date: '2026-05-03', d: 'May 3', taken: 2, missed: 2, total: 4 },
  { date: '2026-05-02', d: 'May 2', taken: 4, missed: 0, total: 4 },
  { date: '2026-05-01', d: 'May 1', taken: 3, missed: 1, total: 4 },
  { date: '2026-04-30', d: 'Apr 30', taken: 4, missed: 0, total: 4 },
];
const avg = Math.round(HIST.reduce((s, d) => s + (d.taken / d.total) * 100, 0) / HIST.length);

export default function HistoryPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>History & Reports</h1>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 18px' }}>Your medication adherence over the past 7 days</p>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px', marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>7-Day Overview</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 90, marginBottom: 8 }}>
          {HIST.map(d => {
            const pct = Math.round((d.taken / d.total) * 100);
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: pct > 75 ? COLORS.success : pct > 50 ? COLORS.warning : COLORS.danger }}>{pct}%</span>
                <div style={{ width: '100%', background: COLORS.border, borderRadius: 4, overflow: 'hidden', height: 55, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${pct}%`, background: pct > 75 ? COLORS.success : pct > 50 ? COLORS.accent : COLORS.danger, borderRadius: '3px 3px 0 0' }} />
                </div>
                <span style={{ fontSize: 10, color: COLORS.muted }}>{d.d.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: COLORS.primary }}>Weekly Average: {avg}%</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Daily Log</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Date', 'Total', 'Taken', 'Missed', 'Adherence'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HIST.map(d => {
              const pct = Math.round((d.taken / d.total) * 100);
              return (
                <tr key={d.date} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '9px 12px' }}>{d.d}</td>
                  <td style={{ padding: '9px 12px' }}>{d.total}</td>
                  <td style={{ padding: '9px 12px', color: COLORS.success, fontWeight: 600 }}>{d.taken}</td>
                  <td style={{ padding: '9px 12px', color: COLORS.danger, fontWeight: 600 }}>{d.missed}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ background: pct > 75 ? COLORS.successLight : pct > 50 ? COLORS.warningLight : COLORS.dangerLight, color: pct > 75 ? COLORS.success : pct > 50 ? COLORS.warning : COLORS.danger, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
