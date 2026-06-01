import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAdminStats, getAllUsers, updateUser, deactivateUser, getAllMedications, getAdherenceReport } from '../services/api';

const C = { pri:'#7C3AED', priLt:'#F5F3FF', suc:'#16A34A', sucLt:'#F0FDF4', dan:'#DC2626', danLt:'#FEF2F2', wrn:'#D97706', wrnLt:'#FFFBEB', inf:'#2563EB', infLt:'#EFF6FF', txt:'#111827', mut:'#6B7280', brd:'#E5E7EB', bg:'#F3F4F6', card:'#fff' };
const card = { background:C.card, borderRadius:12, border:`1px solid ${C.brd}`, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', padding:'16px 20px' };
const btn  = (bg=C.pri,cl='#fff') => ({ padding:'7px 14px', borderRadius:7, border:'none', cursor:'pointer', background:bg, color:cl, fontSize:12, fontWeight:500, fontFamily:'inherit' });
const inp  = { width:'100%', padding:'8px 12px', borderRadius:8, border:`1px solid ${C.brd}`, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' };

export default function AdminApp() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [meds,  setMeds]    = useState([]);
  const [report,setReport]  = useState([]);

  useEffect(() => {
    getAdminStats().then(r=>setStats(r.data)).catch(()=>{});
    getAllUsers().then(r=>setUsers(r.data)).catch(()=>{});
    getAllMedications().then(r=>setMeds(r.data)).catch(()=>{});
    getAdherenceReport().then(r=>setReport(r.data)).catch(()=>{});
  }, []);

  const deact = async (id) => {
    if (!window.confirm('Deactivate user?')) return;
    try { await deactivateUser(id); setUsers(p=>p.filter(u=>u.id!==id)); } catch (e) { alert(e.message); }
  };

  return (
    <Layout>
      {(page) => (
        <div style={{ padding:'20px 24px' }}>
          {page==='dashboard'   && <AdminDashboard stats={stats} users={users} />}
          {page==='users'       && <AdminUsers users={users} setUsers={setUsers} onDeact={deact} />}
          {page==='medications' && <AdminMeds meds={meds} />}
          {page==='reports'     && <AdminReports report={report} />}
          {page==='settings'    && <AdminSettings />}
        </div>
      )}
    </Layout>
  );
}

function AdminDashboard({ stats, users }) {
  const counts = {};
  (stats?.users||[]).forEach(r => counts[r.role]=parseInt(r.count));
  const rems = {};
  (stats?.today_reminders||[]).forEach(r => rems[r.status]=parseInt(r.count));
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:0, fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:22, fontWeight:700 }}>Admin Dashboard</h1>
        <p style={{ margin:0, color:C.mut, fontSize:13 }}>System overview</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[['👥 Patients',(counts.patient||0),C.inf,C.infLt],['❤️ Caregivers',(counts.caregiver||0),C.suc,C.sucLt],['🛡️ Admins',(counts.admin||0),C.pri,C.priLt],['💊 Medications',stats?.total_medications||0,C.wrn,C.wrnLt]].map(([label,val,color,bg]) => (
          <div key={label} style={{ ...card, borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:28, fontWeight:700, color, marginBottom:2 }}>{val}</div>
            <div style={{ fontSize:12, color:C.mut }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div style={card}>
          <h3 style={{ margin:'0 0 14px' }}>Today's medication activity</h3>
          {Object.entries(rems).map(([status,count]) => (
            <div key={status} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', borderRadius:7, marginBottom:6, background:status==='taken'?C.sucLt:status==='missed'?C.danLt:C.wrnLt }}>
              <span style={{ fontSize:13, textTransform:'capitalize', fontWeight:500 }}>{status}</span>
              <span style={{ fontSize:13, fontWeight:700, color:status==='taken'?C.suc:status==='missed'?C.dan:C.wrn }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={{ margin:'0 0 14px' }}>Recent users</h3>
          {(users||[]).slice(0,5).map(u => (
            <div key={u.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, padding:'6px 0', borderBottom:`1px solid ${C.brd}` }}>
              <span style={{ fontSize:13 }}>{u.full_name}</span>
              <span style={{ fontSize:11, background:u.role==='admin'?C.priLt:u.role==='caregiver'?C.infLt:C.sucLt, color:u.role==='admin'?C.pri:u.role==='caregiver'?C.inf:C.suc, padding:'2px 7px', borderRadius:20, fontWeight:600, textTransform:'capitalize' }}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ users, setUsers, onDeact }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const filtered = (users||[]).filter(u =>
    (filter==='all'||u.role===filter) &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const save = async () => {
    try {
      await updateUser(editing.id, form);
      setUsers(p => p.map(u => u.id===editing.id ? {...u,...form} : u));
      setEditing(null);
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div><h1 style={{ margin:0, fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>All Users</h1><p style={{ margin:0, color:C.mut, fontSize:13 }}>{filtered.length} users</p></div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input style={{ ...inp, maxWidth:260 }} placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={{ ...inp, maxWidth:140 }} value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value="patient">Patients</option>
          <option value="caregiver">Caregivers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {editing && (
        <div style={{ ...card, marginBottom:16, border:`1px solid ${C.pri}` }}>
          <h3 style={{ margin:'0 0 14px', color:C.pri }}>Edit User</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Full name</label>
              <input style={inp} value={form.full_name||''} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Email</label>
              <input style={inp} value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Role</label>
              <select style={inp} value={form.role||'patient'} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                <option value="patient">Patient</option>
                <option value="caregiver">Caregiver</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.mut, display:'block', marginBottom:4 }}>Status</label>
              <select style={inp} value={form.is_active?'true':'false'} onChange={e=>setForm(p=>({...p,is_active:e.target.value==='true'}))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button onClick={save} style={btn()}>Save Changes</button>
            <button onClick={()=>setEditing(null)} style={btn('#F3F4F6',C.txt)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={card}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Name','Email','Role','Medications','Status','Actions'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:C.mut, textTransform:'uppercase', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(u=>(
              <tr key={u.id}>
                <td style={{ padding:'10px 12px', fontWeight:500, fontSize:13 }}>{u.full_name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:C.mut }}>{u.email}</td>
                <td style={{ padding:'10px 12px' }}><span style={{ background:u.role==='admin'?C.priLt:u.role==='caregiver'?C.infLt:C.sucLt, color:u.role==='admin'?C.pri:u.role==='caregiver'?C.inf:C.suc, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, textTransform:'capitalize' }}>{u.role}</span></td>
                <td style={{ padding:'10px 12px', fontSize:13 }}>{u.med_count||0}</td>
                <td style={{ padding:'10px 12px' }}><span style={{ background:u.is_active?C.sucLt:C.danLt, color:u.is_active?C.suc:C.dan, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{u.is_active?'Active':'Inactive'}</span></td>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>{ setEditing(u); setForm({full_name:u.full_name,email:u.email,role:u.role,is_active:u.is_active}); }} style={btn(C.infLt,C.inf)}>Edit</button>
                    <button onClick={()=>onDeact(u.id)} style={btn(C.danLt,C.dan)}>Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMeds({ meds }) {
  const [search, setSearch] = useState('');
  const filtered = (meds||[]).filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.patient_name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div><h1 style={{ margin:0, fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>All Medications</h1><p style={{ margin:0, color:C.mut, fontSize:13 }}>{filtered.length} medications</p></div>
        <input style={{ ...inp, maxWidth:240 }} placeholder="Search medications..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div style={card}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Medication','Dosage','Frequency','Patient','Patient Email'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:C.mut, textTransform:'uppercase', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(m=>(
              <tr key={m.id}>
                <td style={{ padding:'10px 12px', fontWeight:500, fontSize:13 }}>{m.name}</td>
                <td style={{ padding:'10px 12px', fontSize:13 }}>{m.dosage}</td>
                <td style={{ padding:'10px 12px', fontSize:13 }}>{m.frequency}</td>
                <td style={{ padding:'10px 12px', fontSize:13 }}>{m.patient_name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:C.mut }}>{m.patient_email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminReports({ report }) {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>Adherence Reports</h1>
      <div style={card}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Patient','Email','Total Doses','Taken','Missed','Adherence (30 days)'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:C.mut, textTransform:'uppercase', borderBottom:`1px solid ${C.brd}` }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {(report||[]).map((r,i)=>(
              <tr key={i}>
                <td style={{ padding:'10px 12px', fontWeight:500, fontSize:13 }}>{r.full_name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:C.mut }}>{r.email}</td>
                <td style={{ padding:'10px 12px', fontSize:13 }}>{r.total_doses||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:C.suc, fontWeight:600 }}>{r.taken||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:C.dan, fontWeight:600 }}>{r.missed||0}</td>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:80, height:6, background:C.brd, borderRadius:3 }}><div style={{ height:'100%', borderRadius:3, background:parseFloat(r.adherence_pct)>=80?C.suc:parseFloat(r.adherence_pct)>=50?C.wrn:C.dan, width:`${r.adherence_pct||0}%` }}/></div>
                    <span style={{ fontSize:12, fontWeight:600 }}>{r.adherence_pct||0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettings() {
  return (
    <div>
      <h1 style={{ margin:'0 0 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:700 }}>System Settings</h1>
      <div style={card}>
        <p style={{ color:C.mut }}>System settings and configuration.</p>
        <div style={{ padding:'12px', background:C.priLt, borderRadius:8, fontSize:13 }}>
          <strong>System Status:</strong> All services running normally ✅
        </div>
      </div>
    </div>
  );
}
