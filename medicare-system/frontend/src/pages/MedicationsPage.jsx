import { useState } from 'react';
import { useMedications } from '../hooks/useApi';

const C = { primary: '#0F6E56', danger: '#E24B4A', textMuted: '#5F5E5A', border: '#D3D1C7' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

const EMPTY_FORM = { medication_name: '', dosage: '', frequency: 'Once daily', times: ['08:00'], category: 'Morning', instructions: '', start_date: '', end_date: '' };

export default function MedicationsPage() {
  const { medications, loading, error, add, update, remove } = useMedications();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (med) => {
    setEditItem(med);
    setForm({ medication_name: med.medication_name, dosage: med.dosage, frequency: med.frequency, times: med.times || ['08:00'], category: med.category || 'Morning', instructions: med.instructions || '', start_date: med.start_date?.split('T')[0] || '', end_date: med.end_date?.split('T')[0] || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.medication_name || !form.dosage || !form.start_date) return;
    setSaving(true);
    try {
      if (editItem) { await update(editItem.medication_id, form); showToast('Medication updated!'); }
      else          { await add(form); showToast('Medication added!'); }
      setShowModal(false);
    } catch (e) { showToast(e.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medication?')) return;
    try { await remove(id); showToast('Medication deleted.'); }
    catch { showToast('Failed to delete.'); }
  };

  const catBg = (c) => c === 'Morning' ? '#FAEEDA' : c === 'Evening' ? '#E6F1FB' : c === 'Afternoon' ? '#EAF3DE' : '#E1F5EE';
  const catColor = (c) => c === 'Morning' ? '#BA7517' : c === 'Evening' ? '#378ADD' : c === 'Afternoon' ? '#639922' : '#0F6E56';

  return (
    <div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#085041', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 300 }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Medications</h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: '4px 0 0' }}>{medications.length} medications registered</p>
        </div>
        <button onClick={openAdd} style={{ padding: '9px 18px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add Medication</button>
      </div>

      {loading && <p style={{ color: C.textMuted }}>Loading medications...</p>}
      {error   && <p style={{ color: C.danger }}>{error}</p>}

      {medications.map(med => (
        <div key={med.medication_id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 48, height: 48, background: catBg(med.category), borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💊</div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{med.medication_name}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: catBg(med.category), color: catColor(med.category) }}>{med.category}</span>
                </div>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 2 }}>
                  <strong>Dosage:</strong> {med.dosage} · <strong>Frequency:</strong> {med.frequency}
                </div>
                <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 2 }}>
                  <strong>Times:</strong> {(med.times || []).join(', ')} · <strong>Instructions:</strong> {med.instructions || '—'}
                </div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>
                  {med.start_date?.split('T')[0]} → {med.end_date?.split('T')[0] || 'Ongoing'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(med)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: C.primary, color: '#fff' }}>Edit</button>
              <button onClick={() => handleDelete(med.medication_id)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: C.danger, color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editItem ? 'Edit Medication' : 'Add New Medication'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textMuted }}>×</button>
            </div>
            {[
              { key: 'medication_name', label: 'Medication Name', ph: 'e.g. Metformin' },
              { key: 'dosage',          label: 'Dosage',          ph: 'e.g. 500mg' },
              { key: 'instructions',    label: 'Instructions',    ph: 'e.g. Take with food' },
              { key: 'start_date',      label: 'Start Date',      type: 'date' },
              { key: 'end_date',        label: 'End Date (optional)', type: 'date' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input style={inputStyle} type={f.type || 'text'} placeholder={f.ph} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
              </div>
            ))}
            {[
              { key: 'frequency', label: 'Frequency', options: ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'] },
              { key: 'category',  label: 'Category',  options: ['Morning', 'Afternoon', 'Evening', 'Morning & Evening'] },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <select style={inputStyle} value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {saving ? 'Saving...' : 'Save Medication'}
              </button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
