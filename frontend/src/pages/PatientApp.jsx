import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getMedications, addMedication, updateMedication, deleteMedication, getReminders, updateStatus, getReminderStats, getReminderHistory, getNotifications, getMe, updateProfile } from '../services/api';

const C = {
  pri:'#0F6E56', priLt:'#E1F5EE', priDk:'#052e16',
  suc:'#16A34A', sucLt:'#F0FDF4', sucDk:'#166534',
  dan:'#DC2626', danLt:'#FEF2F2', danDk:'#991B1B',
  wrn:'#D97706', wrnLt:'#FFFBEB', wrnDk:'#92400E',
  inf:'#2563EB', infLt:'#EFF6FF', infDk:'#1E40AF',
  txt:'#111827', mut:'#6B7280', brd:'#E5E7EB', bg:'#F3F4F6', card:'#fff',
};

const card = { background:C.card, borderRadius:12, border:`1px solid ${C.brd}`, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', padding:'16px 20px' };
const btn  = (bg='#0F6E56',cl='#fff') => ({ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', background:bg, color:cl, fontSize:13, fontWeight:500, fontFamily:'inherit' });
const inp  = { width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${C.brd}`, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' };

export default function PatientApp() {
  const [meds, setMeds]           = useState([]);
  const [rems, setRems]           = useState([]);
  const [stats, setStats]         = useState(null);
  const [history, setHistory]     = useState([]);
  const [notifs, setNotifs]       = useState([]);
  const [pending, setPending]     = useState(0);

  const load = useCallback(async () => {
    try {
      const [m, r, s, h, n] = await Promise.all([
        getMedications(), getReminders(), getReminderStats(), getReminderHistory(), getNotifications()
      ]);
      setMeds(m.data); setRems(r.data); setStats(s.data); setHistory(h.data); setNotifs(n.data);
      setPending((r.data||[]).filter(x=>x.status==='pending').length);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const mark = async (id, status) => {
    try {
      await updateStatus(id, { status });
      setRems(prev => prev.map(r => r.id===id ? {...r, status} : r));
      if (status === 'taken') setPending(p => Math.max(0, p-1));
    } catch (e) { alert(e.message); }
  };

  return (
    <Layout pendingCount={pending}>
      {(page) => (
        <div style={{ padding:'20px 24px' }}>
          {page==='dashboard'   && <Dashboard stats={stats} rems={rems} meds={meds} mark={mark} />}
          {page==='medications' && <Medications meds={meds} reload={load} />}
          {page==='reminders'   && <Reminders rems={rems} mark={mark} />}
          {page==='history'     && <History history={history} />}
          {page==='caregiver'   && <CaregiverPage />}
          {page==='ai'          && <AIAssistant meds={meds} />}
          {page==='profile'     && <Profile reload={load} />}
        </div>
      )}
    </Layout>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────
function Dashboard({ stats, rems, meds, mark }) {
  const t = stats?.today || {};
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:'Plus Jakarta Sans,Inter,sans-serif', fontSize:22, fontWeight:700, margin:'0 0 4px' }}>Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'} 👋</h1>
        <p style={{ color:C.mut, fontSize:14 }}>Here's your medication overview for today</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[['Today\'s doses',t.total||0,C.inf,C.infLt],['Taken',t.taken||0,C.suc,C.sucLt],['Missed',t.missed||0,C.dan,C.danLt],['Pending',t.pending||0,C.wrn,C.wrnLt]].map(([label,val,color,bg]) => (
          <div key={label} style={{ ...card, borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:28, fontWeight:700, color, marginBottom:2 }}>{val}</div>
            <div style={{ fontSize:12, color:C.mut }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ margin:0, fontSize:15, fontWeight:600 }}>Today's schedule</h3>
            <span style={{ background:C.priLt, color:C.pri, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>{Math.round((t.taken||0)*100/Math.max(t.total||1,1))}% adherence</span>
          </div>
          {(rems||[]).length === 0 ? (
            <div style={{ textAlign:'center', padding:24, color:C.mut }}>No reminders for today</div>
          ) : (rems||[]).map(r => (
            <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', marginBottom:8, borderRadius:9, background:r.status==='taken'?C.sucLt:r.status==='missed'?C.danLt:C.wrnLt, border:`1px solid ${r.status==='taken'?'#BBF7D0':r.status==='missed'?'#FECACA':'#FDE68A'}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{r.med_name} {r.dosage}</div>
                <div style={{ fontSize:11, color:C.mut }}>{r.scheduled_time?.slice(0,5)} · {r.category || 'General'}</div>
              </div>
              {r.status === 'pending' ? (
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>mark(r.id,'taken')} style={{ ...btn(C.suc), padding:'5px 12px', fontSize:12 }}>✓ Taken</button>
                  <button onClick={()=>mark(r.id,'missed')} style={{ ...btn(C.dan), padding:'5px 10px', fontSize:12 }}>✗</button>
                </div>
              ) : (
                <span style={{ fontSize:11, fontWeight:600, color:r.status==='taken'?C.suc:C.dan, textTransform:'capitalize' }}>{r.status}</span>
              )}
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:600 }}>Adherence</h3>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:40, fontWeight:700, color:C.pri }}>{Math.round((t.taken||0)*100/Math.max(t.total||1,1))}%</div>
            <div style={{ fontSize:12, color:C.mut }}>Today's score</div>
          </div>
          <div style={{ height:6, background:C.brd, borderRadius:3, marginBottom:12 }}>
            <div style={{ height:'100%', borderRadius:3, background:C.suc, width:`${Math.round((t.taken||0)*100/Math.max(t.total||1,1))}%`, transition:'width 0.5s' }} />
          </div>
          <div style={{ fontSize:12, color:C.mut }}>Total meds: {(meds||[]).length}</div>
        </div>
      </div>
    </div>
  );
}

// ─── MEDICATIONS ────────────────────────────────────────────────
function Medications({ meds, reload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ name:'', dosage:'', frequency:'Once daily', times:['08:00'], category:'General', instructions:'', start_date:new Date().toISOString().split('T')[0] });
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');

  const reset = () => { setForm({ name:'', dosage:'', frequency:'Once daily', times:['08:00'], category:'General', instructions:'', start_date:new Date().toISOString().split('T')[0] }); setEditing(null); setErr(''); };

  const save = async () => {
    if (!form.name || !form.dosage) { setErr('Name and dosage required'); return; }
    setBusy(true); setErr('');
    try {
      if (editing) await updateMedication(editing.id, form);
      else         await addMedication(form);
      await reload(); setShowAdd(false); reset();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const del = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try { await deleteMedication(id); await reload(); } catch (e) { alert(e.message); }
  };

  const openEdit = (med) => {
    setForm({ name:med.name, dosage:med.dosage, frequency:med.frequency, times:med.times||['08:00'], category:med.category||'General', instructions:med.instructions||'', start_date:med.start_date?.split('T')[0]||new Date().toISOString().split('T')[0] });
    setEditing(med); setShowAdd(true);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div><h1 style={{ margin:0, fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Medications</h1><p style={{ margin:0, color:C.mut, fontSize:13 }}>{(meds||[]).length} active medications</p></div>
        <button onClick={()=>{ reset(); setShowAdd(true); }} style={btn()}>+ Add Medication</button>
      </div>

      {showAdd && (
        <div style={{ ...card, marginBottom:20, border:`1px solid ${C.pri}` }}>
          <h3 style={{ margin:'0 0 16px', color:C.pri }}>{editing ? 'Edit' : 'Add'} Medication</h3>
          {err && <div style={{ padding:'8px 12px', background:C.danLt, color:C.dan, borderRadius:7, marginBottom:12, fontSize:13 }}>{err}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['Medication name','name','Metformin'],['Dosage','dosage','500mg']].map(([label,key,ph]) => (
              <div key={key}>
                <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>{label} *</label>
                <input style={inp} placeholder={ph} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Frequency</label>
              <select style={inp} value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                {['Once daily','Twice daily','Three times daily','Every 8 hours','As needed'].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Time(s)</label>
              <input style={inp} placeholder="08:00,20:00" value={form.times.join(',')} onChange={e=>setForm(p=>({...p,times:e.target.value.split(',').map(t=>t.trim())}))} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Start date</label>
              <input style={inp} type="date" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Instructions</label>
              <input style={inp} placeholder="Take with food" value={form.instructions} onChange={e=>setForm(p=>({...p,instructions:e.target.value}))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <button onClick={save} disabled={busy} style={btn()}>{busy?'Saving...':editing?'Update':'Add Medication'}</button>
            <button onClick={()=>{setShowAdd(false);reset();}} style={btn('#F3F4F6',C.txt)}>Cancel</button>
          </div>
        </div>
      )}

      {(meds||[]).length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>💊</div>
          <h3>No medications yet</h3>
          <p style={{ color:C.mut }}>Add your first medication to get started</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          {(meds||[]).map(med => (
            <div key={med.id} style={{ ...card, borderLeft:`4px solid ${C.pri}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{med.name}</div>
                  <div style={{ fontSize:13, color:C.mut }}>{med.dosage} · {med.frequency}</div>
                </div>
                <span style={{ background:C.priLt, color:C.pri, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600 }}>{med.category}</span>
              </div>
              <div style={{ fontSize:12, color:C.mut, marginBottom:10 }}>⏰ {(med.times||[]).join(', ')} · Started {med.start_date?.split('T')[0]}</div>
              {med.instructions && <div style={{ fontSize:12, color:C.txt, background:C.bg, padding:'6px 10px', borderRadius:6, marginBottom:10 }}>{med.instructions}</div>}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>openEdit(med)} style={{ ...btn('#EFF6FF',C.inf), padding:'5px 12px', fontSize:12 }}>Edit</button>
                <button onClick={()=>del(med.id,med.name)} style={{ ...btn(C.danLt,C.dan), padding:'5px 12px', fontSize:12 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REMINDERS ──────────────────────────────────────────────────
function Reminders({ rems, mark }) {
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:0, fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Today's Reminders</h1>
        <p style={{ margin:0, color:C.mut, fontSize:13 }}>{(rems||[]).filter(r=>r.status==='pending').length} pending</p>
      </div>
      {(rems||[]).length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔔</div>
          <h3>No reminders today</h3>
        </div>
      ) : (rems||[]).map(r => (
        <div key={r.id} style={{ ...card, marginBottom:10, borderLeft:`4px solid ${r.status==='taken'?C.suc:r.status==='missed'?C.dan:C.wrn}`, background:r.status==='taken'?C.sucLt:r.status==='missed'?C.danLt:C.wrnLt }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:C.txt }}>{r.med_name} — {r.dosage}</div>
              <div style={{ fontSize:12, color:C.mut, marginTop:2 }}>⏰ {r.scheduled_time?.slice(0,5)} · {r.category || 'General'}</div>
              {r.instructions && <div style={{ fontSize:12, color:C.txt, marginTop:4 }}>📋 {r.instructions}</div>}
            </div>
            {r.status === 'pending' ? (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>mark(r.id,'taken')} style={{ ...btn(C.suc), padding:'7px 16px' }}>✓ Taken</button>
                <button onClick={()=>mark(r.id,'missed')} style={{ ...btn(C.dan), padding:'7px 14px' }}>✗ Missed</button>
              </div>
            ) : (
              <span style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:r.status==='taken'?C.suc:C.dan, color:'#fff', textTransform:'capitalize' }}>{r.status}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── HISTORY ────────────────────────────────────────────────────
function History({ history }) {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Medication History</h1>
      {(history||[]).length === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
          <h3>No history yet</h3>
          <p style={{ color:C.mut }}>Start taking your medications to see history</p>
        </div>
      ) : (
        <div style={card}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Date','Total','Taken','Missed','Adherence'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:C.mut, textTransform:'uppercase', borderBottom:`1px solid ${C.brd}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(history||[]).map(row => (
                <tr key={row.date}>
                  <td style={{ padding:'10px 12px', fontSize:13 }}>{row.date}</td>
                  <td style={{ padding:'10px 12px', fontSize:13 }}>{row.total}</td>
                  <td style={{ padding:'10px 12px', fontSize:13, color:C.suc, fontWeight:600 }}>{row.taken}</td>
                  <td style={{ padding:'10px 12px', fontSize:13, color:C.dan, fontWeight:600 }}>{row.missed}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:C.brd, borderRadius:3 }}>
                        <div style={{ height:'100%', borderRadius:3, background:parseFloat(row.adherence_pct)>=80?C.suc:parseFloat(row.adherence_pct)>=50?C.wrn:C.dan, width:`${row.adherence_pct||0}%` }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, minWidth:35 }}>{row.adherence_pct||0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── CAREGIVER PAGE ─────────────────────────────────────────────
function CaregiverPage() {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>My Caregiver</h1>
      <div style={card}>
        <h3 style={{ margin:'0 0 14px' }}>How to link a caregiver</h3>
        <div style={{ background:C.priLt, borderRadius:10, padding:'14px 16px', fontSize:13, color:C.priDk, lineHeight:1.7 }}>
          <strong>Step 1:</strong> Your caregiver registers on this website as a "Caregiver"<br/>
          <strong>Step 2:</strong> They go to their dashboard → "Link Patient" → enter your email<br/>
          <strong>Step 3:</strong> They can now see your medications and receive missed dose alerts<br/>
          <strong>Your email:</strong> <strong>Share this with your caregiver</strong>
        </div>
        <div style={{ marginTop:14, padding:'12px 16px', background:C.sucLt, borderRadius:8, fontSize:13, color:C.sucDk }}>
          ✅ Once linked, your caregiver will automatically receive alerts when you miss a dose
        </div>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ───────────────────────────────────────────────
function AIAssistant({ meds }) {
  const [msgs, setMsgs] = useState([{ role:'ai', text:'👋 Hi! I\'m your MediCare AI assistant. I can help you with:\n\n• Information about your medications\n• Side effects and interactions\n• General health advice\n• Doctor recommendations\n• What to do if you miss a dose\n\nWhat would you like to know?' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy]   = useState(false);

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput('');
    setMsgs(p => [...p, { role:'user', text:msg }]);
    setBusy(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system:`You are a helpful medical AI assistant for MediCare PRO pharmacy app. The patient's current medications are: ${(meds||[]).map(m=>`${m.name} ${m.dosage} - ${m.frequency}`).join(', ') || 'none listed'}. 

Help with:
- Medication information, side effects, and interactions
- General health advice and symptoms
- When to see a doctor (provide general specialties like "cardiologist", "endocrinologist" etc)
- What to do if a dose is missed
- Emergency contacts: Call 000 for emergencies in Australia

Always remind users to consult their doctor for medical decisions. Keep responses concise and helpful.`,
          messages:[...msgs.filter(m=>m.role!='ai'||msgs.indexOf(m)>0).map(m=>({ role:m.role==='user'?'user':'assistant', content:m.text })), { role:'user', content:msg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not get a response.';
      setMsgs(p => [...p, { role:'ai', text:reply }]);
    } catch {
      setMsgs(p => [...p, { role:'ai', text:'Sorry, I\'m having trouble connecting. Please try again.' }]);
    }
    setBusy(false);
  };

  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>AI Health Assistant</h1>
      <div style={card}>
        <div style={{ height:380, overflowY:'auto', padding:'4px 0', marginBottom:14 }}>
          {msgs.map((m,i) => (
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', marginBottom:12 }}>
              <div style={{ maxWidth:'78%', padding:'10px 14px', borderRadius:m.role==='user'?'12px 12px 0 12px':'12px 12px 12px 0', background:m.role==='user'?C.pri:'#F3F4F6', color:m.role==='user'?'#fff':C.txt, fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:12 }}><div style={{ padding:'10px 14px', borderRadius:'12px 12px 12px 0', background:'#F3F4F6', fontSize:13, color:C.mut }}>Thinking...</div></div>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input style={{ ...inp, flex:1, marginBottom:0 }} placeholder="Ask about your medications, symptoms, or health..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} />
          <button onClick={send} disabled={busy} style={{ ...btn(), padding:'9px 16px' }}>Send</button>
        </div>
        <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
          {['What are the side effects?','Can I take these together?','I missed my dose','When should I see a doctor?'].map(q => (
            <button key={q} onClick={()=>{setInput(q);}} style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${C.brd}`, background:'#fff', fontSize:11, cursor:'pointer', color:C.txt, fontFamily:'inherit' }}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE ────────────────────────────────────────────────────
function Profile({ reload }) {
  const { user, updateUser } = require('../context/AuthContext').useAuth ? require('../context/AuthContext').useAuth() : {};
  const [form, setForm] = useState({ full_name:'', phone:'' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMe().then(r => setForm({ full_name: r.data.full_name||'', phone: r.data.phone||'' })).catch(()=>{});
  }, []);

  const save = async () => {
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Profile Settings</h1>
      <div style={{ ...card, maxWidth:480 }}>
        {saved && <div style={{ padding:'8px 12px', background:C.sucLt, color:C.suc, borderRadius:7, marginBottom:12, fontSize:13 }}>✅ Profile saved!</div>}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Full name</label>
          <input style={inp} value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Phone</label>
          <input style={inp} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
        </div>
        <button onClick={save} style={btn()}>Save Changes</button>
      </div>
    </div>
  );
}
