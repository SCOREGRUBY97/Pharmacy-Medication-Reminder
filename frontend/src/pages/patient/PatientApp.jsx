import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { C, S, statusColor, catStyle } from '../../constants/styles';
import { getMedications, addMedication, updateMedication, deleteMedication, getReminders, updateStatus, getReminderHistory, getReminderStats, getNotifications } from '../../services/api';

const NAV = [
  { id: 'dashboard',   icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'medications', icon: 'ti-pill',              label: 'Medications' },
  { id: 'reminders',   icon: 'ti-bell',              label: 'Reminders' },
  { id: 'history',     icon: 'ti-chart-bar',         label: 'History' },
  { id: 'caregiver',   icon: 'ti-users',             label: 'My Caregiver' },
  { id: 'ai',          icon: 'ti-sparkles',          label: 'AI Assistant' },
  { id: 'profile',     icon: 'ti-settings',          label: 'Profile' },
];

const EMPTY_MED = { name:'',generic_name:'',dosage:'',dosage_unit:'mg',frequency:'Once daily',times:['08:00'],category:'Morning',medication_type:'tablet',instructions:'',side_effects:'',prescribed_by:'',start_date:new Date().toISOString().split('T')[0],end_date:'',refill_reminder:false,current_stock:'' };

export default function PatientApp() {
  const { user } = useAuth();
  const [meds,    setMeds]    = useState([]);
  const [rems,    setRems]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [hist,    setHist]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');

  const initials = user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'U';
  const pending = rems.filter(r=>r.status==='pending').length;

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, r, s, h] = await Promise.all([
        getMedications({ active_only: true }),
        getReminders(),
        getReminderStats().catch(() => ({ data: null })),
        getReminderHistory({ days: 30 }),
      ]);
      setMeds(m.data); setRems(r.data); setStats(s.data); setHist(h.data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRem = async (id, status, notes = '') => {
    try {
      await updateStatus(id, { status, notes });
      setRems(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(status === 'taken' ? 'Medication marked as taken! Saved to database ✓' : 'Dose marked as missed. Caregiver alerted.', status === 'taken' ? 'success' : 'warning');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const navWithBadge = NAV.map(n => ({ ...n, badge: n.id === 'reminders' ? pending : 0 }));

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, padding: '12px 18px', borderRadius: 12, background: toast.type === 'error' ? C.dan : toast.type === 'warning' ? C.wrn : C.suc, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
          <i className={`ti ti-${toast.type === 'error' ? 'alert-circle' : toast.type === 'warning' ? 'alert-triangle' : 'check'}`} aria-hidden="true" />
          {toast.msg}
        </div>
      )}
      <Layout navItems={navWithBadge} sbColor={C.priDk} role="patient"
        userName={user?.full_name} userEmail={user?.email} userInitials={initials}>
        {(page) => {
          if (page === 'dashboard')   return <PatientDashboard rems={rems} meds={meds} stats={stats} onMark={markRem} />;
          if (page === 'medications') return <PatientMedications meds={meds} setMeds={setMeds} showToast={showToast} />;
          if (page === 'reminders')   return <PatientReminders rems={rems} onMark={markRem} />;
          if (page === 'history')     return <PatientHistory hist={hist} stats={stats} />;
          if (page === 'caregiver')   return <PatientCaregiver user={user} />;
          if (page === 'ai')          return <PatientAI meds={meds} user={user} />;
          if (page === 'profile')     return <PatientProfile user={user} showToast={showToast} />;
          return null;
        }}
      </Layout>
    </>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function PatientDashboard({ rems, meds, stats, onMark }) {
  const taken   = rems.filter(r=>r.status==='taken').length;
  const missed  = rems.filter(r=>r.status==='missed').length;
  const pending = rems.filter(r=>r.status==='pending').length;
  const pct     = rems.length ? Math.round((taken/rems.length)*100) : 0;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'} 👋</h1>
        <p style={{ color: C.mut, fontSize: 14 }}>Here's your medication overview for today</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: "Today's doses", val: rems.length, color: C.infMd, bg: C.infLt, icon: 'ti-pill' },
          { label: 'Taken',         val: taken,        color: C.sucMd, bg: C.sucLt, icon: 'ti-check' },
          { label: 'Missed',        val: missed,       color: C.dan,   bg: C.danLt, icon: 'ti-x' },
          { label: 'Pending',       val: pending,      color: C.acc,   bg: C.accLt, icon: 'ti-clock' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: `1px solid ${C.brd}`, borderTop: `4px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <i className={`ti ${s.icon}`} style={{ color: s.color, fontSize: 18 }} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        {/* Reminders */}
        <div style={{ flex: 2.2 }}>
          <div style={{ ...S.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Today's schedule</div>
              <span style={{ background: C.priXl, color: C.priDk, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{pct}% adherence</span>
            </div>
            {rems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: C.mut }}>
                <i className="ti ti-calendar-check" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: C.brd }} aria-hidden="true" />
                No reminders for today
              </div>
            ) : rems.map(r => {
              const sc = statusColor(r.status);
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, marginBottom: 8, background: sc.bg, borderLeft: `4px solid ${sc.border}`, transition: 'transform 0.12s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: sc.border + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ti ti-pill" style={{ color: sc.border, fontSize: 17 }} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.txt }}>{r.med_name || r.medication_name} {r.dosage}</div>
                    <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{String(r.scheduled_time).substring(0,5)} · {r.category}</div>
                    {r.instructions && <div style={{ fontSize: 11, color: C.mut }}>{r.instructions}</div>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.border, color: '#fff' }}>{r.status}</span>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => onMark(r.id, 'taken')} style={{ padding: '5px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.suc, color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                        <i className="ti ti-check" aria-hidden="true" /> Taken
                      </button>
                      <button onClick={() => onMark(r.id, 'missed')} style={{ padding: '5px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.dan, color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                        Missed
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: 1 }}>
          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Adherence progress</div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: pct > 70 ? C.suc : pct > 40 ? C.wrn : C.dan }}>{pct}%</div>
              <div style={{ fontSize: 12, color: C.mut }}>Today's score</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.brd, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: pct > 70 ? C.suc : pct > 40 ? C.acc : C.dan, transition: 'width 0.5s' }} />
            </div>
            {[['Total meds', meds.length], ['Weekly avg', `${stats?.week_adherence || 0}%`], ['Streak', `${stats?.streak_days || 0} days`]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid #f0f0f0`, fontSize: 13 }}>
                <span style={{ color: C.mut }}>{k}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Low stock alert */}
          {meds.filter(m => m.current_stock && m.current_stock <= 10).map(m => (
            <div key={m.id} style={{ ...S.card, background: C.danLt, border: `1px solid ${C.dan}`, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.danDk }}>
                <i className="ti ti-alert-triangle" aria-hidden="true" /> Low stock alert
              </div>
              <div style={{ fontSize: 12, color: C.danDk, marginTop: 4 }}>{m.name} — only {m.current_stock} doses left</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MEDICATIONS ─────────────────────────────────────────────
function PatientMedications({ meds, setMeds, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed]   = useState(null);
  const [form, setForm]         = useState(EMPTY_MED);
  const [saving, setSaving]     = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openEdit = (med) => {
    setEditMed(med);
    setForm({ ...EMPTY_MED, ...med, times: med.times || ['08:00'] });
    setShowForm(true);
  };

  const openAdd = () => {
    setEditMed(null);
    setForm(EMPTY_MED);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.dosage || !form.start_date) { showToast('Name, dosage and start date are required', 'error'); return; }
    setSaving(true);
    try {
      const data = { ...form, times: Array.isArray(form.times) ? form.times : [form.times] };
      if (editMed) {
        const r = await updateMedication(editMed.id, data);
        setMeds(prev => prev.map(m => m.id === editMed.id ? r.data.medication : m));
        showToast('Medication updated!');
      } else {
        const r = await addMedication(data);
        setMeds(prev => [...prev, r.data.medication]);
        showToast('Medication added! Reminder scheduled automatically.');
      }
      setShowForm(false); setEditMed(null);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try {
      await deleteMedication(id);
      setMeds(prev => prev.filter(m => m.id !== id));
      showToast('Medication removed.');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const inpStyle = { width: '100%', padding: '9px 11px', borderRadius: 9, border: `1px solid ${C.brd}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.txt, background: '#fff', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <p style={{ color: C.mut, fontSize: 14 }}>{meds.length} medications registered and tracked</p>
        </div>
        <button onClick={openAdd} style={{ ...S.btnPrimary(C.pri) }}>
          <i className="ti ti-plus" aria-hidden="true" /> Add medication
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...S.card, marginBottom: 16, border: `2px solid ${C.pri}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: C.priDk }}>
            {editMed ? 'Edit medication' : 'Add new medication'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['Name *','name','text','e.g. Metformin'],['Dosage *','dosage','text','e.g. 500mg'],
              ['Generic name','generic_name','text','Optional'],['Prescribed by','prescribed_by','text','Doctor name'],
              ['Start date *','start_date','date',''],['End date','end_date','date','']].map(([l,k,t,ph]) => (
              <div key={k}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>{l}</label>
                <input style={inpStyle} type={t} placeholder={ph} value={form[k]} onChange={set(k)} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Frequency *</label>
              <select style={inpStyle} value={form.frequency} onChange={set('frequency')}>
                {['Once daily','Twice daily','Three times daily','Four times daily','Every 8 hours','Weekly','As needed'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Category</label>
              <select style={inpStyle} value={form.category} onChange={set('category')}>
                {['Morning','Afternoon','Evening','Morning & Evening','General'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Type</label>
              <select style={inpStyle} value={form.medication_type} onChange={set('medication_type')}>
                {['tablet','capsule','liquid','injection','topical','inhaler','drops','patch','other'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Reminder time(s)</label>
              <input style={inpStyle} type="time" value={form.times?.[0] || '08:00'} onChange={e => setForm(p => ({ ...p, times: [e.target.value] }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Current stock</label>
              <input style={inpStyle} type="number" placeholder="Number of pills" value={form.current_stock} onChange={set('current_stock')} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.mut }}>
                <input type="checkbox" checked={form.refill_reminder} onChange={e => setForm(p => ({ ...p, refill_reminder: e.target.checked }))} />
                Refill reminder
              </label>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Instructions</label>
            <input style={inpStyle} placeholder="e.g. Take with food, avoid alcohol" value={form.instructions} onChange={set('instructions')} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Side effects to watch for</label>
            <input style={inpStyle} placeholder="e.g. Nausea, dizziness" value={form.side_effects} onChange={set('side_effects')} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={saving} style={{ ...S.btnPrimary(C.pri), flex: 1, justifyContent: 'center' }}>
              {saving ? 'Saving...' : editMed ? 'Update medication' : 'Add medication'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ ...S.btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Medication list */}
      {meds.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '48px', color: C.mut }}>
          <i className="ti ti-pill" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: C.brd }} aria-hidden="true" />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No medications yet</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Add your first medication to start getting reminders</div>
          <button onClick={openAdd} style={{ ...S.btnPrimary(C.pri) }}>Add first medication</button>
        </div>
      ) : meds.map(m => {
        const cs = catStyle(m.category);
        return (
          <div key={m.id} style={{ ...S.card, marginBottom: 10, transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: cs.bg, border: `1px solid ${cs.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-pill" style={{ color: cs.color, fontSize: 20 }} aria-hidden="true" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: C.txt }}>{m.name}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: C.mut }}>{m.dosage}</span>
                    <span style={{ background: cs.bg, color: cs.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${cs.border}` }}>{m.category}</span>
                    <span style={{ background: '#f5f5f5', color: C.mut, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{m.medication_type}</span>
                    {m.current_stock && m.current_stock <= 10 && (
                      <span style={{ background: C.danLt, color: C.danDk, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} aria-hidden="true" /> Low: {m.current_stock} left
                      </span>
                    )}
                  </div>
                  <div style={{ color: C.mut, fontSize: 13, marginBottom: 3 }}>
                    <i className="ti ti-repeat" style={{ fontSize: 12 }} aria-hidden="true" /> {m.frequency} · {(m.times || []).join(', ')}
                  </div>
                  {m.instructions && <div style={{ color: C.mut, fontSize: 12 }}><i className="ti ti-info-circle" style={{ fontSize: 11 }} aria-hidden="true" /> {m.instructions}</div>}
                  {m.side_effects && <div style={{ color: C.wrn, fontSize: 12 }}><i className="ti ti-alert-circle" style={{ fontSize: 11 }} aria-hidden="true" /> Watch for: {m.side_effects}</div>}
                  <div style={{ color: C.mut, fontSize: 11, marginTop: 4 }}>
                    {m.start_date} → {m.end_date || 'Ongoing'} · {m.prescribed_by && `Prescribed by ${m.prescribed_by}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button onClick={() => openEdit(m)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.brd}`, cursor: 'pointer', background: '#fff', color: C.mut, fontSize: 12, fontFamily: 'inherit' }}>
                  <i className="ti ti-edit" aria-hidden="true" /> Edit
                </button>
                <button onClick={() => del(m.id, m.name)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.dan}`, cursor: 'pointer', background: C.danLt, color: C.danDk, fontSize: 12, fontFamily: 'inherit' }}>
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── REMINDERS ───────────────────────────────────────────────
function PatientReminders({ rems, onMark }) {
  const groups = [
    { key: 'pending', label: 'Pending',  icon: 'ti-clock',  },
    { key: 'taken',   label: 'Taken',    icon: 'ti-check',  },
    { key: 'missed',  label: 'Missed',   icon: 'ti-x',      },
    { key: 'snoozed', label: 'Snoozed',  icon: 'ti-zzz',    },
  ];
  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>{rems.length} reminders scheduled for today</p>
      {groups.map(g => {
        const list = rems.filter(r => r.status === g.key);
        const sc   = statusColor(g.key);
        return (
          <div key={g.key} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${g.icon}`} style={{ color: sc.border, fontSize: 13 }} aria-hidden="true" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: C.txt }}>{g.label}</span>
              <span style={{ background: sc.bg, color: sc.text, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${sc.border}` }}>{list.length}</span>
            </div>
            {list.length === 0 ? (
              <div style={{ color: C.mut, fontSize: 13, fontStyle: 'italic', padding: '6px 0 0 34px' }}>None</div>
            ) : list.map(r => {
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, marginBottom: 8, background: sc.bg, borderLeft: `4px solid ${sc.border}`, transition: 'transform 0.12s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.med_name || r.medication_name} {r.dosage}</div>
                    <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>Scheduled: {String(r.scheduled_time).substring(0,5)} · {r.instructions}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.border, color: '#fff' }}>{r.status}</span>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => onMark(r.id, 'taken')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.suc, color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Mark taken</button>
                      <button onClick={() => onMark(r.id, 'missed')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.dan, color: '#fff', fontSize: 12, fontFamily: 'inherit' }}>Missed</button>
                      <button onClick={() => onMark(r.id, 'snoozed')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.brd}`, cursor: 'pointer', background: '#fff', color: C.mut, fontSize: 12, fontFamily: 'inherit' }}>Snooze 10m</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── HISTORY ─────────────────────────────────────────────────
function PatientHistory({ hist, stats }) {
  const avg = hist.length ? Math.round(hist.reduce((s,d) => s + parseFloat(d.adherence_pct || 0), 0) / hist.length) : 0;
  const maxTotal = Math.max(...hist.map(d => d.total || 1), 1);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Weekly adherence', val: `${stats?.week_adherence || 0}%`, color: C.suc },
          { label: 'Monthly adherence', val: `${stats?.month_adherence || 0}%`, color: C.infMd },
          { label: 'Current streak',   val: `${stats?.streak_days || 0} days`, color: C.acc },
          { label: '30-day average',   val: `${avg}%`, color: C.pri },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: `1px solid ${C.brd}`, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.mut }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>30-day adherence chart</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 100, marginBottom: 8 }}>
          {hist.slice(0, 30).reverse().map((d, i) => {
            const pct = parseFloat(d.adherence_pct) || 0;
            const h = Math.max((pct / 100) * 80, 4);
            const col = pct >= 80 ? C.suc : pct >= 60 ? C.acc : C.dan;
            return (
              <div key={i} title={`${d.date}: ${pct}%`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', height: h, background: col, borderRadius: '3px 3px 0 0', minHeight: 4, transition: 'height 0.3s' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.mut, borderTop: `1px solid ${C.brd}`, paddingTop: 6 }}>
          <span>30 days ago</span><span>Today</span>
        </div>
      </div>

      <div style={{ ...S.card }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Daily log</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', fontSize: 12, fontWeight: 600, color: C.mut, padding: '6px 0', borderBottom: `1px solid ${C.brd}`, gap: 8, marginBottom: 4 }}>
          <div>Date</div><div style={{ textAlign: 'center' }}>Total</div><div style={{ textAlign: 'center', color: C.suc }}>Taken</div><div style={{ textAlign: 'center', color: C.dan }}>Missed</div><div style={{ textAlign: 'center' }}>Rate</div>
        </div>
        {hist.slice(0, 14).map((d, i) => {
          const pct = parseFloat(d.adherence_pct) || 0;
          const col = pct >= 80 ? C.suc : pct >= 60 ? C.wrn : C.dan;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', padding: '9px 0', borderBottom: `1px solid #f5f5f5`, fontSize: 13, gap: 8, alignItems: 'center' }}>
              <div style={{ color: C.txt }}>{new Date(d.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              <div style={{ textAlign: 'center', color: C.mut }}>{d.total}</div>
              <div style={{ textAlign: 'center', color: C.suc, fontWeight: 600 }}>{d.taken}</div>
              <div style={{ textAlign: 'center', color: C.dan, fontWeight: 600 }}>{d.missed}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ background: col + '22', color: col, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CAREGIVER PAGE ──────────────────────────────────────────
function PatientCaregiver({ user }) {
  const [caregivers, setCaregivers] = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [form, setForm]             = useState({ caregiver_email: '', relationship: '' });
  const [loading, setLoading]       = useState(true);
  const [linking, setLinking]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const API = (await import('../../services/api'));
      // Get notifications to show alerts
      const n = await API.getNotifications();
      setAlerts(n.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const linkCaregiver = async () => {
    if (!form.caregiver_email) { setError('Please enter caregiver email'); return; }
    setLinking(true); setError('');
    try {
      const API = (await import('../../services/api'));
      await API.linkPatient({ patient_email: form.caregiver_email, relationship: form.relationship || 'Caregiver' });
      setSuccess('Caregiver linked successfully! They can now monitor your medications.');
      setShowForm(false);
      setForm({ caregiver_email: '', relationship: '' });
    } catch (err) {
      setError(err.message || 'Failed to link caregiver. Make sure they have a caregiver account.');
    } finally { setLinking(false); }
  };

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff/60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m/60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h/24) + 'd ago';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.mut }}>Loading...</div>;

  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>Link a caregiver to monitor your medication adherence in real-time</p>

      {success && (
        <div style={{ background: C.sucLt, border: `1px solid ${C.sucMd}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14, color: C.suc, fontSize: 13 }}>
          ✅ {success}
        </div>
      )}

      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Caregiver access</div>
          <button onClick={() => setShowForm(!showForm)} style={{ ...S.btnPrimary(C.pri), fontSize: 12 }}>
            <i className="ti ti-user-plus" aria-hidden="true" /> {showForm ? 'Cancel' : 'Link Caregiver'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#f8fffe', border: `1px solid ${C.priXl}`, borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: C.mut, marginBottom: 12 }}>Enter the email of your caregiver. They must already have a MediCare caregiver account.</p>
            {error && <div style={{ color: C.dan, fontSize: 12, marginBottom: 10, background: C.danLt, padding: '8px 12px', borderRadius: 7 }}>⚠️ {error}</div>}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Caregiver email address *</label>
              <input style={{ ...S.input }} placeholder="caregiver@email.com" value={form.caregiver_email} onChange={e => setForm(p => ({ ...p, caregiver_email: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Relationship</label>
              <input style={{ ...S.input }} placeholder="e.g. Daughter, Son, Nurse, Doctor" value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} />
            </div>
            <button onClick={linkCaregiver} disabled={linking} style={{ ...S.btnPrimary(C.pri) }}>
              {linking ? 'Linking...' : 'Link Caregiver'}
            </button>
          </div>
        )}

        <div style={{ background: C.priXl, borderRadius: 10, padding: '14px 16px', fontSize: 13, color: C.priDk }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>ℹ️ How it works:</div>
          <div>1. Your caregiver registers at this website as a "Caregiver"</div>
          <div>2. They go to their dashboard → "Link Patient" → enter your email</div>
          <div>3. They can then see your medications and get missed dose alerts</div>
        </div>

        <div style={{ fontWeight: 600, fontSize: 12, color: C.mut, letterSpacing: 0.5, margin: '16px 0 10px' }}>WHAT YOUR CAREGIVER CAN SEE</div>
        {["Today's medication schedule","Missed dose alerts in real-time","Weekly adherence reports","Your medication list & dosages"].map(item => (
          <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '6px 0', fontSize: 13, borderBottom: `1px solid #f5f5f5` }}>
            <i className="ti ti-circle-check" style={{ color: C.suc, fontSize: 14, flexShrink: 0 }} aria-hidden="true" />{item}
          </div>
        ))}
      </div>

      <div style={{ ...S.card }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent notifications & alerts</div>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: C.mut, fontSize: 13 }}>No alerts yet</div>
        ) : alerts.slice(0, 10).map((n) => (
          <div key={n.id} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid #f5f5f5` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.type==='missed'?C.dan:n.type==='reminder'?C.suc:C.infMd, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: C.mut }}>{n.message}</div>
              <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{timeAgo(n.sent_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────
function PatientAI({ meds, user }) {
  const [msgs, setMsgs]   = useState([{ r:'ai', t: 'Hello! I\'m your MediCare AI assistant with advanced pharmacology knowledge. I can help you with medication questions, symptom analysis, drug interactions, and doctor recommendations. What would you like to know?' }]);
  const [inp, setInp]     = useState('');
  const [loading, setLoading] = useState(false);

  const KNOWLEDGE = {
    metformin: { info: 'Metformin is a first-line medication for Type 2 diabetes. It works by reducing glucose production in the liver and improving insulin sensitivity. Take with food to minimize GI side effects. Avoid alcohol. Regular kidney function tests are recommended.', sideEffects: 'Nausea, diarrhea, stomach upset (usually temporary), vitamin B12 deficiency with long-term use. Rare but serious: lactic acidosis.', interactions: 'Avoid with alcohol, contrast dyes. Caution with ibuprofen, certain antibiotics.' },
    amlodipine: { info: 'Amlodipine is a calcium channel blocker used for hypertension and angina. It relaxes blood vessels so the heart doesn\'t have to pump as hard.', sideEffects: 'Ankle swelling, flushing, headache, dizziness. Usually mild and temporary.', interactions: 'Caution with grapefruit juice, simvastatin. Discuss with doctor before taking with other blood pressure medications.' },
    atorvastatin: { info: 'Atorvastatin is a statin medication that reduces cholesterol and lowers risk of heart attack and stroke. Best taken at bedtime as cholesterol production peaks at night.', sideEffects: 'Muscle pain or weakness (important — report immediately), liver enzyme elevation, digestive issues.', interactions: 'Avoid grapefruit juice. Caution with antibiotics like erythromycin, antifungals. Do not combine with fibrates without medical supervision.' },
    'vitamin d': { info: 'Vitamin D3 supports bone health, immune function, and mood. Deficiency is very common in Australia despite sunshine. Take with a fatty meal for best absorption.', sideEffects: 'Very safe at recommended doses. Excess (>4000 IU/day) can cause nausea, weakness, kidney problems.', interactions: 'May interact with certain cholesterol medications, steroids, and diuretics at high doses.' },
  };

  const DOCTORS = [
    { name: 'Dr. Michael Chen', specialty: 'General Practitioner', phone: '+61 2 9000 1111', email: 'dr.chen@medicare-clinic.com.au', address: '123 Health St, Sydney NSW 2000' },
    { name: 'Dr. Sarah Williams', specialty: 'Endocrinologist (Diabetes)', phone: '+61 2 9000 2222', email: 'dr.williams@endocrine.com.au', address: '456 Medical Ave, Sydney NSW 2010' },
    { name: 'Dr. James Park', specialty: 'Cardiologist', phone: '+61 2 9000 3333', email: 'dr.park@cardiology.com.au', address: '789 Heart Rd, Sydney NSW 2020' },
    { name: 'Dr. Lisa Nguyen', specialty: 'Pharmacist Consultant', phone: '+61 2 9000 4444', email: 'dr.nguyen@pharmacy.com.au', address: '321 Pharmacy Blvd, Sydney NSW 2030' },
  ];

  const SYMPTOMS = {
    'chest pain':    { severity: 'URGENT', msg: '⚠️ URGENT: Chest pain can be serious. Call 000 immediately or go to your nearest emergency department. Do not ignore chest pain, especially if you also have shortness of breath, sweating, or arm pain.', doc: DOCTORS[2] },
    'heart':         { severity: 'HIGH', msg: 'Heart-related symptoms should be evaluated promptly. I recommend seeing a cardiologist.', doc: DOCTORS[2] },
    'blood sugar':   { severity: 'MEDIUM', msg: 'Blood sugar management is crucial for diabetes. Your endocrinologist can help optimize your Metformin dosage and overall diabetes management.', doc: DOCTORS[1] },
    'diabetes':      { severity: 'MEDIUM', msg: 'For diabetes management, I recommend seeing an endocrinologist who can provide comprehensive care including medication review, lifestyle advice, and complication screening.', doc: DOCTORS[1] },
    'dizzy':         { severity: 'MEDIUM', msg: 'Dizziness can be a side effect of Amlodipine (blood pressure medication). If severe or persistent, contact your GP. Avoid sudden position changes — stand up slowly.', doc: DOCTORS[0] },
    'nausea':        { severity: 'LOW', msg: 'Nausea is a common side effect of Metformin, especially initially. Take it with food or at the end of meals. If severe or persistent after 2 weeks, consult your GP.', doc: DOCTORS[0] },
    'muscle pain':   { severity: 'HIGH', msg: 'Muscle pain or weakness while on Atorvastatin can be a sign of myopathy — a serious side effect. Stop Atorvastatin and contact your doctor today. This is especially important if your urine appears dark.', doc: DOCTORS[0] },
    'swelling':      { severity: 'MEDIUM', msg: 'Ankle/leg swelling can be a side effect of Amlodipine. Mild swelling is common. Elevate your legs when resting. If severe or sudden, see your doctor.', doc: DOCTORS[0] },
    'headache':      { severity: 'LOW', msg: 'Headaches can be a side effect of Amlodipine when starting treatment. Usually resolves within a few weeks. If severe or persistent, consult your GP.', doc: DOCTORS[0] },
    'tired':         { severity: 'LOW', msg: 'Fatigue can have many causes. Make sure you\'re taking your medications as prescribed. Poor diabetes control can cause fatigue. A blood sugar check and GP visit is recommended.', doc: DOCTORS[0] },
    'missed':        { severity: 'INFO', msg: 'If you missed a dose: Take it as soon as you remember, unless it\'s almost time for your next dose — then skip it. Never double up doses. Log missed doses in your adherence tracker so your caregiver is notified.' },
    'interaction':   { severity: 'INFO', msg: 'Drug interactions are important. Your medications (Metformin + Amlodipine + Atorvastatin + Vitamin D3) have low interaction risk with each other. Always tell pharmacists and doctors ALL medications including supplements.' },
    'refill':        { severity: 'INFO', msg: 'To refill prescriptions: Contact your GP at least 5-7 days before you run out. For Metformin and Atorvastatin, you may be eligible for repeat prescriptions from your pharmacy.' },
    'side effect':   { severity: 'INFO', msg: 'Report any side effects to your doctor. Common ones are listed for each medication in your medications page. Serious side effects — chest pain, severe muscle pain, difficulty breathing — require immediate medical attention.' },
  };

  const generateResponse = (userMsg) => {
    const msg = userMsg.toLowerCase();

    // Check symptoms first
    for (const [key, data] of Object.entries(SYMPTOMS)) {
      if (msg.includes(key)) {
        let response = `**${data.severity === 'URGENT' ? '🚨 URGENT' : data.severity === 'HIGH' ? '⚠️ Important' : '💊 MediCare AI'}**\n\n${data.msg}`;
        if (data.doc) {
          response += `\n\n**Recommended doctor:**\n👨‍⚕️ ${data.doc.name} — ${data.doc.specialty}\n📞 ${data.doc.phone}\n📧 ${data.doc.email}\n📍 ${data.doc.address}`;
        }
        if (data.severity === 'URGENT') response += '\n\n**Call 000 now for emergencies.**';
        return response;
      }
    }

    // Check medication knowledge
    for (const [key, data] of Object.entries(KNOWLEDGE)) {
      if (msg.includes(key)) {
        return `**About ${key.charAt(0).toUpperCase() + key.slice(1)}:**\n\n${data.info}\n\n**Side effects to watch for:**\n${data.sideEffects}\n\n**Interactions:**\n${data.interactions}\n\n📞 Always consult your prescribing doctor: ${DOCTORS[0].name} · ${DOCTORS[0].phone}`;
      }
    }

    // Medication list from patient's actual meds
    if (msg.includes('my medication') || msg.includes('what medication')) {
      if (meds.length === 0) return 'You have no medications registered yet. Go to the Medications tab to add your first medication.';
      return `You currently have ${meds.length} medications registered:\n\n${meds.map(m => `💊 **${m.name} ${m.dosage}** — ${m.frequency}\n   Time: ${(m.times||[]).join(', ')} · ${m.instructions || 'No special instructions'}`).join('\n\n')}\n\nWould you like information about any specific medication?`;
    }

    // Doctor recommendation
    if (msg.includes('doctor') || msg.includes('specialist') || msg.includes('recommend')) {
      return `**Recommended doctors based on your conditions:**\n\n${DOCTORS.map(d => `👨‍⚕️ **${d.name}** — ${d.specialty}\n📞 ${d.phone}\n📧 ${d.email}\n📍 ${d.address}`).join('\n\n')}\n\n*Note: Always call ahead to book an appointment. In an emergency, call 000.*`;
    }

    // General responses
    if (msg.includes('emergency') || msg.includes('000')) return '🚨 In a medical emergency, call **000** immediately. Do not wait — emergency services are available 24/7 across Australia.';
    if (msg.includes('hello') || msg.includes('hi')) return `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm your MediCare AI assistant. I can help with:\n\n• Medication information & side effects\n• Symptom analysis & severity assessment\n• Drug interaction checks\n• Doctor recommendations with contact details\n• Missed dose guidance\n• Refill reminders\n\nWhat would you like to know?`;

    return `I understand you're asking about "${userMsg}". Based on your current medications (${meds.map(m=>m.name).join(', ') || 'none registered yet'}), I recommend:\n\n1. Check the Medications tab for specific medication information\n2. If you have symptoms, describe them in detail and I'll assess severity\n3. For urgent concerns, contact your GP: **${DOCTORS[0].name}** at ${DOCTORS[0].phone}\n\nCan you be more specific about what you need help with?`;
  };

  const send = async () => {
    if (!inp.trim()) return;
    const userMsg = inp;
    setInp('');
    setMsgs(prev => [...prev, { r: 'u', t: userMsg }]);
    setLoading(true);
    setTimeout(() => {
      const response = generateResponse(userMsg);
      setMsgs(prev => [...prev, { r: 'ai', t: response }]);
      setLoading(false);
    }, 800);
  };

  const suggestions = ['What are my current medications?', 'Side effects of Metformin?', 'I have chest pain', 'Drug interactions in my meds', 'Recommend a doctor', 'What if I missed a dose?', 'I feel dizzy', 'Muscle pain while on Atorvastatin'];

  const formatMsg = (text) => {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <div key={i} style={{ marginBottom: line === '' ? 6 : 2 }} dangerouslySetInnerHTML={{ __html: bold }} />;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #185FA5, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-sparkles" style={{ color: '#fff', fontSize: 18 }} aria-hidden="true" />
        </div>
        <div>
          <p style={{ color: C.mut, fontSize: 13 }}>Pharmacology AI · Medication advice · Symptom assessment · Doctor referrals</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => { setInp(s); }}
            style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${C.brd}`, background: '#fff', color: C.pri, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
            onMouseOver={e => { e.currentTarget.style.background = C.priXl; e.currentTarget.style.borderColor = C.pri; }}
            onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.brd; }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        {/* Chat messages */}
        <div style={{ height: 380, overflowY: 'auto', padding: '16px' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.r === 'u' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              {m.r === 'ai' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #185FA5, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                  <i className="ti ti-sparkles" style={{ color: '#fff', fontSize: 12 }} aria-hidden="true" />
                </div>
              )}
              <div style={{ maxWidth: '80%', padding: '11px 14px', borderRadius: m.r === 'u' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.r === 'u' ? C.pri : '#f5f5f3', color: m.r === 'u' ? '#fff' : C.txt, fontSize: 13, lineHeight: 1.5 }}>
                {m.r === 'ai' ? formatMsg(m.t) : m.t}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #185FA5, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <i className="ti ti-sparkles" style={{ color: '#fff', fontSize: 12 }} aria-hidden="true" />
              </div>
              <div style={{ padding: '12px 16px', background: '#f5f5f3', borderRadius: '4px 16px 16px 16px', fontSize: 13, color: C.mut }}>
                Analyzing... ●●●
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '8px 16px', background: '#FFFBEE', borderTop: `1px solid ${C.accLt}`, fontSize: 11, color: C.wrn }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 12 }} aria-hidden="true" /> This AI provides general information only. Always consult a qualified healthcare professional for medical advice.
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.brd}`, display: 'flex', gap: 10 }}>
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about medications, symptoms, doctors..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.brd}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.txt }} />
          <button onClick={send} disabled={loading || !inp.trim()}
            style={{ padding: '10px 18px', borderRadius: 12, border: 'none', cursor: inp.trim() ? 'pointer' : 'not-allowed', background: inp.trim() ? C.pri : C.brd, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            <i className="ti ti-send" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────
function PatientProfile({ user, showToast }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', notify_email: user?.notify_email ?? true, notify_push: user?.notify_push ?? true, notify_sms: user?.notify_sms ?? false, doctor_name: user?.doctor_name || '', emergency_contact_name: user?.emergency_contact_name || '', emergency_contact_phone: user?.emergency_contact_phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const { updateProfile: updateProfileApi, changePassword } = require('../../services/api');

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await updateProfileApi(form);
      setUser(r.data.user);
      showToast('Profile updated successfully!');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1.5 }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Personal information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.brd}` }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${C.priDk}, ${C.pri})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.full_name}</div>
                <div style={{ color: C.mut, fontSize: 13 }}>{user?.email}</div>
                <span style={{ background: C.priXl, color: C.priDk, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{user?.role}</span>
              </div>
            </div>
            {[['Full name','full_name','text'],['Phone','phone','tel'],['Doctor name','doctor_name','text'],['Emergency contact name','emergency_contact_name','text'],['Emergency contact phone','emergency_contact_phone','tel']].map(([l,k,t]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>{l}</label>
                <input style={{ ...S.input }} type={t} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <button onClick={saveProfile} disabled={saving} style={{ ...S.btnPrimary(C.pri), marginTop: 8 }}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Notification preferences</div>
            {[['Email reminders','notify_email','ti-mail'],['Push notifications (laptop/phone)','notify_push','ti-device-laptop'],['SMS alerts','notify_sms','ti-device-mobile']].map(([l,k,ic]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid #f5f5f5` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
                  <i className={`ti ${ic}`} style={{ color: C.pri, fontSize: 16 }} aria-hidden="true" />{l}
                </div>
                <div onClick={() => setForm(p => ({ ...p, [k]: !p[k] }))}
                  style={{ width: 40, height: 22, borderRadius: 11, background: form[k] ? C.pri : C.brd, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: form[k] ? 21 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Change password</div>
            {[['Current password','current_password'],['New password (min 8 chars)','new_password']].map(([l,k]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>{l}</label>
                <input style={{ ...S.input }} type="password" value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <button onClick={async () => {
              try { await changePassword(pwForm); showToast('Password changed!'); setPwForm({ current_password:'', new_password:'' }); }
              catch (err) { showToast(err.message, 'error'); }
            }} style={{ ...S.btnPrimary(C.pri) }}>Change password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
