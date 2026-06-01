import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getPatients, getPatientOverview, linkPatient, unlinkPatient } from '../services/api';

const C = { pri:'#2563EB', priLt:'#EFF6FF', suc:'#16A34A', sucLt:'#F0FDF4', dan:'#DC2626', danLt:'#FEF2F2', wrn:'#D97706', wrnLt:'#FFFBEB', txt:'#111827', mut:'#6B7280', brd:'#E5E7EB', bg:'#F3F4F6', card:'#fff' };
const card = { background:C.card, borderRadius:12, border:`1px solid ${C.brd}`, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', padding:'16px 20px' };
const btn  = (bg=C.pri,cl='#fff') => ({ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', background:bg, color:cl, fontSize:13, fontWeight:500, fontFamily:'inherit' });
const inp  = { width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${C.brd}`, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' };

export default function CaregiverApp() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getPatients().then(r => { setPatients(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const selectPatient = async (p) => {
    setSelected(p); setOverview(null);
    try { const r = await getPatientOverview(p.id); setOverview(r.data); } catch {}
  };

  const unlink = async (id) => {
    if (!window.confirm('Unlink this patient?')) return;
    await unlinkPatient(id);
    setPatients(p => p.filter(x => x.id !== id));
    if (selected?.id === id) { setSelected(null); setOverview(null); }
  };

  return (
    <Layout>
      {(page) => (
        <div style={{ padding:'20px 24px' }}>
          {page==='patients' && <Patients patients={patients} loading={loading} selected={selected} overview={overview} onSelect={selectPatient} onUnlink={unlink} />}
          {page==='alerts'   && <Alerts patients={patients} />}
          {page==='reports'  && <Reports patients={patients} />}
          {page==='link'     && <LinkPatient onLinked={p => setPatients(prev => [...prev, p])} />}
          {page==='profile'  && <CGProfile />}
        </div>
      )}
    </Layout>
  );
}

function Patients({ patients, loading, selected, overview, onSelect, onUnlink }) {
  if (loading) return <div style={{ padding:40, textAlign:'center', color:C.mut }}>Loading...</div>;
  return (
    <div>
      <h1 style={{ margin:'0 0 4px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>My Patients</h1>
      <p style={{ margin:'0 0 20px', color:C.mut, fontSize:13 }}>{patients.length} patient{patients.length!==1?'s':''} linked</p>

      {patients.length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          <h3>No patients linked yet</h3>
          <p style={{ color:C.mut }}>Go to "Link Patient" to add a patient</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 1.5fr':'repeat(2,1fr)', gap:16 }}>
          <div>
            {patients.map(p => (
              <div key={p.id} onClick={()=>onSelect(p)} style={{ ...card, marginBottom:10, cursor:'pointer', borderLeft:`4px solid ${selected?.id===p.id?C.pri:C.brd}`, background:selected?.id===p.id?C.priLt:C.card }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{p.full_name}</div>
                    <div style={{ fontSize:12, color:C.mut }}>{p.email}</div>
                    <div style={{ fontSize:12, color:C.mut, marginTop:2 }}>{p.relationship} · {p.med_count||0} meds</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {p.missed_today > 0 && <span style={{ background:C.danLt, color:C.dan, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, display:'block', marginBottom:4 }}>⚠️ {p.missed_today} missed</span>}
                    <span style={{ fontSize:11, color:C.mut }}>{p.adherence_pct||0}% adherence</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ margin:0 }}>{selected.full_name}</h3>
                <button onClick={()=>onUnlink(selected.id)} style={{ ...btn(C.danLt, C.dan), padding:'5px 12px', fontSize:12 }}>Unlink</button>
              </div>
              <div style={{ fontSize:12, color:C.mut, marginBottom:14 }}>{selected.email} · {selected.phone||'No phone'}</div>

              {!overview ? <div style={{ color:C.mut, fontSize:13 }}>Loading details...</div> : (
                <>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.mut, marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Today's Reminders</div>
                    {(overview.reminders||[]).length === 0 ? <div style={{ fontSize:13, color:C.mut }}>No reminders today</div> : (overview.reminders||[]).map(r => (
                      <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', borderRadius:7, marginBottom:6, background:r.status==='taken'?C.sucLt:r.status==='missed'?C.danLt:C.wrnLt }}>
                        <span style={{ fontSize:13 }}>{r.med_name} {r.dosage} — {r.scheduled_time?.slice(0,5)}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:r.status==='taken'?C.suc:r.status==='missed'?C.dan:C.wrn, textTransform:'capitalize' }}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.mut, marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Medications ({(overview.medications||[]).length})</div>
                    {(overview.medications||[]).map(m => (
                      <div key={m.id} style={{ fontSize:13, padding:'6px 10px', background:C.bg, borderRadius:6, marginBottom:6 }}>
                        <strong>{m.name}</strong> {m.dosage} — {m.frequency}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Alerts({ patients }) {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Patient Alerts</h1>
      <div style={card}>
        {patients.filter(p=>p.missed_today>0).length === 0 ? (
          <div style={{ textAlign:'center', padding:30, color:C.mut }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
            <div style={{ fontWeight:600 }}>All patients on track today!</div>
          </div>
        ) : patients.filter(p=>p.missed_today>0).map(p => (
          <div key={p.id} style={{ padding:'12px', borderRadius:9, background:C.danLt, border:`1px solid #FECACA`, marginBottom:10 }}>
            <div style={{ fontWeight:600, color:C.dan }}>⚠️ {p.full_name} missed {p.missed_today} dose{p.missed_today>1?'s':''} today</div>
            <div style={{ fontSize:12, color:C.mut, marginTop:2 }}>{p.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reports({ patients }) {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Adherence Reports</h1>
      <div style={card}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Patient','Email','Adherence (7 days)','Missed Today'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:C.mut, textTransform:'uppercase', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {patients.map(p=>(
              <tr key={p.id}>
                <td style={{ padding:'10px 12px', fontWeight:500 }}>{p.full_name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:C.mut }}>{p.email}</td>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:80, height:6, background:C.brd, borderRadius:3 }}><div style={{ height:'100%', borderRadius:3, background:parseFloat(p.adherence_pct)>=80?C.suc:parseFloat(p.adherence_pct)>=50?C.wrn:C.dan, width:`${p.adherence_pct||0}%` }}/></div>
                    <span style={{ fontSize:12, fontWeight:600 }}>{p.adherence_pct||0}%</span>
                  </div>
                </td>
                <td style={{ padding:'10px 12px', color:p.missed_today>0?C.dan:C.suc, fontWeight:600 }}>{p.missed_today||0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinkPatient({ onLinked }) {
  const [form, setForm] = useState({ patient_email:'', relationship:'' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');

  const link = async () => {
    if (!form.patient_email) { setErr('Enter patient email'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await linkPatient(form);
      setMsg(r.data.message || 'Linked!');
      setForm({ patient_email:'', relationship:'' });
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Link a Patient</h1>
      <div style={{ ...card, maxWidth:460 }}>
        <p style={{ fontSize:13, color:C.mut, marginBottom:16 }}>Enter the email of the patient you want to monitor. They must already have a patient account on MediCare.</p>
        {msg && <div style={{ padding:'8px 12px', background:C.sucLt, color:C.suc, borderRadius:7, marginBottom:12, fontSize:13 }}>✅ {msg}</div>}
        {err && <div style={{ padding:'8px 12px', background:C.danLt, color:C.dan, borderRadius:7, marginBottom:12, fontSize:13 }}>⚠️ {err}</div>}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Patient email address *</label>
          <input style={inp} type="email" placeholder="patient@email.com" value={form.patient_email} onChange={e=>setForm(p=>({...p,patient_email:e.target.value}))} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Your relationship</label>
          <input style={inp} placeholder="e.g. Daughter, Son, Nurse" value={form.relationship} onChange={e=>setForm(p=>({...p,relationship:e.target.value}))} />
        </div>
        <button onClick={link} disabled={busy} style={btn()}>{busy?'Linking...':'🔗 Link Patient'}</button>
      </div>
    </div>
  );
}

function CGProfile() {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Profile</h1>
      <div style={{ ...card, maxWidth:460 }}>
        <p style={{ color:C.mut, fontSize:13 }}>Profile settings coming soon.</p>
      </div>
    </div>
  );
}
