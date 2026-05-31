import { useState } from 'react';

const COLORS = { primary: '#0F6E56', danger: '#E24B4A', dangerLight: '#FCEBEB', border: '#D3D1C7', muted: '#5F5E5A' };
const MEDS = [
  { id: 1, name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', times: ['08:00', '20:00'], instructions: 'Take with food', category: 'Morning & Evening' },
  { id: 2, name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', times: ['08:00'], instructions: 'Take in morning', category: 'Morning' },
  { id: 3, name: 'Vitamin D3', dosage: '1000IU', frequency: 'Once daily', times: ['13:00'], instructions: 'Take after lunch', category: 'Afternoon' },
  { id: 4, name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', times: ['21:00'], instructions: 'Take at bedtime', category: 'Evening' },
];

export default function MedicationsPage() {
  const [meds, setMeds] = useState(MEDS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'Once daily', instructions: '', category: 'Morning' });

  const addMed = () => {
    if (!form.name || !form.dosage) return;
    setMeds(prev => [...prev, { ...form, id: Date.now(), times: ['08:00'] }]);
    setShowForm(false);
    setForm({ name: '', dosage: '', frequency: 'Once daily', instructions: '', category: 'Morning' });
  };

  const catColor = c => c === 'Morning' ? '#BA7517' : c === 'Evening' ? '#378ADD' : c === 'Afternoon' ? '#639922' : '#0F6E56';
  const catBg = c => c === 'Morning' ? '#FAEEDA' : c === 'Evening' ? '#E6F1FB' : c === 'Afternoon' ? '#EAF3DE' : '#E1F5EE';

  const inp = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Medications</h1>
          <p style={{ color: COLORS.muted, fontSize: 13, margin: '3px 0 0' }}>{meds.length} medications registered</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: COLORS.primary, color: '#fff', fontSize: 13, fontWeight: 600 }}>+ Add Medication</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '20px 24px', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Add New Medication</h3>
          <input style={inp} placeholder="Medication Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inp} placeholder="Dosage (e.g. 500mg) *" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} />
          <input style={inp} placeholder="Instructions" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
          <select style={inp} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
            {['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {['Morning', 'Afternoon', 'Evening', 'Morning & Evening'].map(o => <option key={o}>{o}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addMed} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer', background: COLORS.primary, color: '#fff', fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.border}`, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      )}

      {meds.map(m => (
        <div key={m.id} style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: catBg(m.category), borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>💊</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</span>
                  <span style={{ background: catBg(m.category), color: catColor(m.category), padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{m.category}</span>
                </div>
                <div style={{ color: COLORS.muted, fontSize: 12 }}><strong>Dosage:</strong> {m.dosage} · <strong>Frequency:</strong> {m.frequency}</div>
                <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}><strong>Times:</strong> {m.times?.join(', ')} · {m.instructions}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#E6F1FB', color: '#185FA5', fontSize: 11, fontWeight: 600 }}>Edit</button>
              <button onClick={() => setMeds(prev => prev.filter(x => x.id !== m.id))} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: COLORS.dangerLight, color: COLORS.danger, fontSize: 11, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
