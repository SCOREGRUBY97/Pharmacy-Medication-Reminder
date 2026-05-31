import { useState } from 'react';

const COLORS = { primary: '#0F6E56', danger: '#E24B4A', dangerLight: '#FCEBEB', info: '#378ADD', success: '#639922', successLight: '#EAF3DE', muted: '#5F5E5A', border: '#D3D1C7' };

export default function CaregiverPage() {
  const [linked, setLinked] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', relationship: '' });
  const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Caregiver Support</h1>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 18px' }}>Link a caregiver to monitor your medication adherence</p>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px', marginBottom: 14 }}>
        {linked ? (
          <>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Linked Caregiver</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: COLORS.successLight, borderRadius: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>MJ</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Mary Johnson</div>
                <div style={{ color: COLORS.muted, fontSize: 12 }}>mary.j@example.com · Daughter</div>
                <div style={{ color: COLORS.muted, fontSize: 12 }}>+61 400 111 222</div>
              </div>
              <span style={{ background: COLORS.successLight, color: COLORS.success, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Active</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>CAREGIVER CAN SEE:</div>
              {["Today's medication schedule", "Missed dose alerts", "Weekly adherence reports", "Prescription details"].map(item => (
                <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: COLORS.success }}>✓</span> {item}
                </div>
              ))}
            </div>
            <button onClick={() => setLinked(false)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: COLORS.dangerLight, color: COLORS.danger, fontSize: 13, fontWeight: 600 }}>Remove Caregiver</button>
          </>
        ) : (
          <>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Link a Caregiver</h3>
            <input style={inp} placeholder="Caregiver Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input style={inp} type="email" placeholder="Email Address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input style={inp} type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <input style={inp} placeholder="Relationship (e.g. Daughter, Nurse)" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} />
            <button onClick={() => setLinked(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: COLORS.primary, color: '#fff', fontSize: 13, fontWeight: 600 }}>Link Caregiver</button>
          </>
        )}
      </div>

      {linked && (
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Recent Alerts Sent</h3>
          {[["Vitamin D3 dose missed at 13:00", "Today, 1:30 PM", "missed"], ["Metformin taken at 08:05", "Today, 8:05 AM", "taken"], ["Weekly summary sent", "Yesterday, 9:00 AM", "info"]].map(([msg, dt, t], i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t === 'missed' ? COLORS.danger : t === 'taken' ? COLORS.success : COLORS.info, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13 }}>{msg}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{dt}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
