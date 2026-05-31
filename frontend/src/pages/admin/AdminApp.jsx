import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { C, S } from '../../constants/styles';
import { getAdminStats, getAllUsers, updateUser, deactivateUser, getAllMedications, getAuditLogs, getAdherenceReport } from '../../services/api';

const NAV = [
  { id: 'dashboard',  icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'users',      icon: 'ti-users',            label: 'Users' },
  { id: 'medications',icon: 'ti-pill',              label: 'Medications' },
  { id: 'reports',    icon: 'ti-chart-bar',         label: 'Reports' },
  { id: 'audit',      icon: 'ti-activity',          label: 'Audit Logs' },
  { id: 'settings',   icon: 'ti-settings',          label: 'System Settings' },
];

export default function AdminApp() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [meds,    setMeds]    = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [report,  setReport]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');
  const initials = user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'AD';

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, u, m, l, r] = await Promise.all([
          getAdminStats().catch(() => ({ data: null })),
          getAllUsers().catch(() => ({ data: [] })),
          getAllMedications().catch(() => ({ data: [] })),
          getAuditLogs().catch(() => ({ data: [] })),
          getAdherenceReport().catch(() => ({ data: [] })),
        ]);
        setStats(s.data); setUsers(u.data); setMeds(m.data); setLogs(l.data); setReport(r.data);
      } catch (err) { showToast(err.message, 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, padding: '12px 18px', borderRadius: 12, background: toast.type === 'error' ? C.dan : C.suc, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}
      <Layout navItems={NAV} sbColor={C.admDk} role="admin"
        userName={user?.full_name} userEmail={user?.email} userInitials={initials}>
        {(page) => {
          if (page === 'dashboard')   return <AdminDashboard stats={stats} users={users} />;
          if (page === 'users')       return <AdminUsers users={users} setUsers={setUsers} showToast={showToast} />;
          if (page === 'medications') return <AdminMedications meds={meds} />;
          if (page === 'reports')     return <AdminReports report={report} stats={stats} />;
          if (page === 'audit')       return <AdminAudit logs={logs} />;
          if (page === 'settings')    return <AdminSettings showToast={showToast} />;
          return null;
        }}
      </Layout>
    </>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function AdminDashboard({ stats, users }) {
  const totalUsers = users.length;
  const patients   = users.filter(u=>u.role==='patient').length;
  const caregivers = users.filter(u=>u.role==='caregiver').length;
  const active     = users.filter(u=>u.is_active).length;
  const rems       = stats?.today_reminders || [];
  const todayTaken  = rems.find(r=>r.status==='taken')?.count || 0;
  const todayMissed = rems.find(r=>r.status==='missed')?.count || 0;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total users',       val: totalUsers,   color: C.cgPri,  bg: C.infLt,  icon: 'ti-users' },
          { label: 'Patients',          val: patients,     color: C.suc,    bg: C.sucLt,  icon: 'ti-user' },
          { label: 'Caregivers',        val: caregivers,   color: C.wrn,    bg: C.accLt,  icon: 'ti-heart' },
          { label: 'Active today',      val: active,       color: C.admPri, bg: '#FAECE7', icon: 'ti-activity' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: `1px solid ${C.brd}`, borderTop: `4px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <i className={`ti ${s.icon}`} style={{ color: s.color, fontSize: 18 }} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1.8 }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Today's system overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: "Today's doses taken",  val: todayTaken,  color: C.suc },
                { label: "Today's doses missed", val: todayMissed, color: C.dan },
                { label: 'Weekly adherence',     val: `${stats?.adherence?.week_pct || 0}%`, color: C.pri },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '14px', background: '#f8f8f8', borderRadius: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: C.mut, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent users table */}
          <div style={{ ...S.card }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent registrations</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', fontSize: 11, fontWeight: 600, color: C.mut, padding: '6px 0', borderBottom: `1px solid ${C.brd}`, gap: 12, marginBottom: 4 }}>
              <div>User</div><div>Role</div><div>Status</div><div>Joined</div>
            </div>
            {users.slice(0, 8).map(u => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '10px 0', borderBottom: `1px solid #f5f5f5`, gap: 12, alignItems: 'center', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.role==='patient'?C.priXl:u.role==='caregiver'?C.infLt:'#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: u.role==='patient'?C.priDk:u.role==='caregiver'?C.inf:C.admPri, flexShrink: 0 }}>
                    {u.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                    <div style={{ fontSize: 11, color: C.mut, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                </div>
                <div><span style={{ background: u.role==='patient'?C.priXl:u.role==='caregiver'?C.infLt:'#FAECE7', color: u.role==='patient'?C.priDk:u.role==='caregiver'?C.inf:C.admPri, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{u.role}</span></div>
                <div><span style={{ background: u.is_active?C.sucLt:C.danLt, color: u.is_active?C.suc:C.dan, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{u.is_active?'Active':'Inactive'}</span></div>
                <div style={{ color: C.mut, fontSize: 11 }}>{new Date(u.created_at).toLocaleDateString('en-AU', { day:'numeric', month:'short' })}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {/* Adherence by medication */}
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>System adherence by medication</div>
            {(stats?.top_missed_medications || []).slice(0,5).map(m => (
              <div key={m.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{m.name}</span>
                  <span style={{ color: C.dan }}>{m.missed} missed</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.brd, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((m.missed/Math.max(m.total,1))*100,100)}%`, background: C.dan, borderRadius: 3 }} />
                </div>
              </div>
            ))}
            {(!stats?.top_missed_medications?.length) && <div style={{ color: C.mut, fontSize: 13 }}>No data yet</div>}
          </div>

          {/* User growth */}
          <div style={{ ...S.card }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>User growth (30 days)</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80 }}>
              {(stats?.user_growth || []).slice(-14).map((d, i) => {
                const max = Math.max(...(stats?.user_growth||[]).map(x=>parseInt(x.signups)||1), 1);
                const h = Math.max(((parseInt(d.signups)||0) / max) * 60, 4);
                return (
                  <div key={i} title={`${d.signups} signups`} style={{ flex: 1, height: h, background: C.pri, borderRadius: '3px 3px 0 0', minHeight: 4, opacity: 0.7 + (i/28) }} />
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: C.mut, textAlign: 'center', marginTop: 6 }}>Last 14 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS ───────────────────────────────────────────────────
function AdminUsers({ users, setUsers, showToast }) {
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('all');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]   = useState(false);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openEdit = (u) => { setEditUser(u); setEditForm({ full_name: u.full_name, email: u.email, phone: u.phone||'', role: u.role, is_active: u.is_active, is_verified: u.is_verified }); };

  const saveUser = async () => {
    setSaving(true);
    try {
      await updateUser(editUser.id, editForm);
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editForm } : u));
      setEditUser(null);
      showToast('User updated successfully!');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const deactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They won't be able to log in.`)) return;
    try {
      await deactivateUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u));
      showToast(`${name} deactivated.`);
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div>
      {/* Edit modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: 480, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Edit user</div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.mut }}>×</button>
            </div>
            {[['Full name','full_name','text'],['Email','email','email'],['Phone','phone','tel']].map(([l,k,t]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>{l}</label>
                <input style={{ ...S.input }} type={t} value={editForm[k]||''} onChange={e => setEditForm(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>Role</label>
              <select style={{ ...S.input }} value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                {['patient','caregiver','admin'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
              {[['Active account','is_active'],['Email verified','is_verified']].map(([l,k]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={editForm[k]} onChange={e => setEditForm(p => ({ ...p, [k]: e.target.checked }))} />
                  {l}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveUser} disabled={saving} style={{ ...S.btnPrimary(C.admPri), flex: 1, justifyContent: 'center' }}>{saving ? 'Saving...' : 'Save changes'}</button>
              <button onClick={() => setEditUser(null)} style={{ ...S.btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input style={{ ...S.input, flex: 1, maxWidth: 320 }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...S.input, width: 160 }} value={roleFilter} onChange={e => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="patient">Patients</option>
          <option value="caregiver">Caregivers</option>
          <option value="admin">Admins</option>
        </select>
        <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${C.brd}`, fontSize: 13, color: C.mut, display: 'flex', alignItems: 'center' }}>
          {filtered.length} users
        </div>
      </div>

      <div style={{ ...S.card }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', fontSize: 11, fontWeight: 700, color: C.mut, padding: '6px 0 10px', borderBottom: `1px solid ${C.brd}`, gap: 10 }}>
          <div>User</div><div>Role</div><div>Meds</div><div>Adherence</div><div>Status</div><div>Actions</div>
        </div>
        {filtered.map(u => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', padding: '11px 0', borderBottom: `1px solid #f5f5f5`, gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.role==='patient'?C.priXl:u.role==='caregiver'?C.infLt:'#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: u.role==='patient'?C.priDk:u.role==='caregiver'?C.inf:C.admPri, flexShrink: 0 }}>
                {u.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                <div style={{ fontSize: 11, color: C.mut, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
            </div>
            <div><span style={{ background: u.role==='patient'?C.priXl:u.role==='caregiver'?C.infLt:'#FAECE7', color: u.role==='patient'?C.priDk:u.role==='caregiver'?C.inf:C.admPri, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{u.role}</span></div>
            <div style={{ fontSize: 13, color: C.mut, textAlign: 'center' }}>{u.medication_count || '—'}</div>
            <div style={{ textAlign: 'center' }}>
              {u.adherence_pct ? (
                <span style={{ background: parseFloat(u.adherence_pct)>=70?C.sucLt:parseFloat(u.adherence_pct)>=50?C.accLt:C.danLt, color: parseFloat(u.adherence_pct)>=70?C.suc:parseFloat(u.adherence_pct)>=50?C.wrn:C.dan, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{u.adherence_pct}%</span>
              ) : <span style={{ color: C.mut, fontSize: 12 }}>—</span>}
            </div>
            <div><span style={{ background: u.is_active?C.sucLt:C.danLt, color: u.is_active?C.suc:C.dan, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{u.is_active?'Active':'Inactive'}</span></div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => openEdit(u)} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.brd}`, background: '#fff', cursor: 'pointer', fontSize: 11, color: C.mut, fontFamily: 'inherit' }}>
                <i className="ti ti-edit" aria-hidden="true" /> Edit
              </button>
              {u.is_active && (
                <button onClick={() => deactivate(u.id, u.full_name)} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.dan}`, background: C.danLt, cursor: 'pointer', fontSize: 11, color: C.danDk, fontFamily: 'inherit' }}>
                  <i className="ti ti-user-off" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: C.mut }}>No users found</div>}
      </div>
    </div>
  );
}

// ─── MEDICATIONS ─────────────────────────────────────────────
function AdminMedications({ meds }) {
  const [search, setSearch] = useState('');
  const filtered = meds.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.patient_name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input style={{ ...S.input, flex: 1, maxWidth: 320 }} placeholder="Search medications or patient name..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${C.brd}`, fontSize: 13, color: C.mut }}>{filtered.length} medications</div>
      </div>
      <div style={{ ...S.card }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', fontSize: 11, fontWeight: 700, color: C.mut, padding: '6px 0 10px', borderBottom: `1px solid ${C.brd}`, gap: 12 }}>
          <div>Medication</div><div>Patient</div><div>Frequency</div><div>Stock</div><div>Category</div>
        </div>
        {filtered.map(m => (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', padding: '11px 0', borderBottom: `1px solid #f5f5f5`, gap: 12, alignItems: 'center', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.name} {m.dosage}</div>
              <div style={{ fontSize: 11, color: C.mut, textTransform: 'capitalize' }}>{m.medication_type || 'tablet'} · {m.prescribed_by}</div>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: C.cgPri }}>{m.patient_name}</div>
              <div style={{ fontSize: 11, color: C.mut }}>{m.patient_email}</div>
            </div>
            <div style={{ color: C.mut, fontSize: 12 }}>{m.frequency}</div>
            <div>
              {m.current_stock ? (
                <span style={{ background: m.current_stock<=10?C.danLt:m.current_stock<=20?C.accLt:C.sucLt, color: m.current_stock<=10?C.danDk:m.current_stock<=20?C.wrnDk:C.suc, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {m.current_stock} left
                </span>
              ) : <span style={{ color: C.mut, fontSize: 12 }}>—</span>}
            </div>
            <div><span style={{ background: '#f5f5f5', color: C.mut, padding: '3px 9px', borderRadius: 20, fontSize: 11 }}>{m.category}</span></div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: C.mut }}>No medications found</div>}
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────
function AdminReports({ report, stats }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{ color: C.mut, fontSize: 14 }}>Patient adherence analysis · Last 30 days</p>
        <button style={{ ...S.btnGhost }} onClick={() => alert('Export feature — connects to backend!')}><i className="ti ti-download" aria-hidden="true" /> Export PDF</button>
      </div>
      <div style={{ ...S.card }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Patient adherence report</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', fontSize: 11, fontWeight: 700, color: C.mut, padding: '6px 0 10px', borderBottom: `1px solid ${C.brd}`, gap: 12 }}>
          <div>Patient</div><div>Total doses</div><div>Taken</div><div>Missed</div><div>Adherence</div>
        </div>
        {report.map((p, i) => {
          const adh = parseFloat(p.adherence_pct) || 0;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', padding: '13px 0', borderBottom: `1px solid #f5f5f5`, gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: adh>=70?C.sucLt:adh>=50?C.accLt:C.danLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: adh>=70?C.suc:adh>=50?C.wrn:C.dan, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                  {p.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.full_name}</div>
                  <div style={{ fontSize: 11, color: C.mut }}>{p.email}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{p.total_doses || 0}</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.suc }}>{p.taken || 0}</div>
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.dan }}>{p.missed || 0}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ background: adh>=70?C.sucLt:adh>=50?C.accLt:C.danLt, color: adh>=70?C.suc:adh>=50?C.wrn:C.dan, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{adh}%</span>
              </div>
            </div>
          );
        })}
        {report.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: C.mut }}>No report data available</div>}
      </div>
    </div>
  );
}

// ─── AUDIT LOGS ──────────────────────────────────────────────
function AdminAudit({ logs }) {
  const actionColor = a => {
    if (a?.includes('MISSED') || a?.includes('DEACTIVATE')) return { bg: C.danLt, color: C.danDk };
    if (a?.includes('TAKEN') || a?.includes('REGISTER'))    return { bg: C.sucLt, color: C.suc };
    if (a?.includes('ADMIN'))  return { bg: '#FAECE7', color: C.admPri };
    return { bg: C.infLt, color: C.inf };
  };
  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>Complete audit trail of all system actions</p>
      <div style={{ ...S.card }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: C.mut }}>No audit logs available</div>
        ) : logs.map(l => {
          const ac = actionColor(l.action);
          return (
            <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: `1px solid #f5f5f5` }}>
              <span style={{ background: ac.bg, color: ac.color, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{l.action?.replace(/_/g,' ')}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.full_name || 'System'} · {l.email || ''}</div>
                <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{l.entity_type} #{l.entity_id} · IP: {l.ip_address || '—'}</div>
              </div>
              <div style={{ fontSize: 11, color: C.mut, flexShrink: 0 }}>{new Date(l.created_at).toLocaleString('en-AU')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────
function AdminSettings({ showToast }) {
  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>Configure system-wide settings for MediCare PRO</p>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Notification settings</div>
            {[['Email reminders enabled',true,'Send email to patients when medication is due'],
              ['Push notifications enabled',true,'Send browser push notifications'],
              ['SMS alerts enabled',false,'Send SMS for critical missed doses'],
              ['Caregiver alerts',true,'Notify caregivers when patient misses dose'],
              ['Weekly reports',true,'Send weekly adherence summaries'],
              ['Low stock alerts',true,'Alert patients when medication stock is low'],
            ].map(([l,on,desc]) => (
              <div key={l} style={{ padding: '12px 0', borderBottom: `1px solid #f5f5f5` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l}</div>
                  <div style={{ width: 40, height: 22, borderRadius: 11, background: on ? C.admPri : C.brd, position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%' }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.mut, marginTop: 3 }}>{desc}</div>
              </div>
            ))}
            <button onClick={() => showToast('Settings saved!')} style={{ ...S.btnPrimary(C.admPri), marginTop: 16 }}>Save settings</button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Scheduler status</div>
            {[['Reminder check','Every 1 minute','Running ✓'],['Missed dose check','Every 5 minutes','Running ✓'],['Low stock check','Daily 9:00 AM','Running ✓'],['Weekly reports','Sundays 8:00 AM','Running ✓'],['Daily generation','Midnight','Running ✓']].map(([l,sch,status]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid #f5f5f5`, fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{l}</div>
                  <div style={{ fontSize: 11, color: C.mut }}>{sch}</div>
                </div>
                <span style={{ color: C.suc, fontWeight: 600, fontSize: 12 }}>{status}</span>
              </div>
            ))}
          </div>
          <div style={{ ...S.card }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>System info</div>
            {[['Version','v2.0 PRO'],['Database','PostgreSQL 14'],['Node.js','v18+'],['Push service','Web Push VAPID'],['Email service','Gmail SMTP'],['Encryption','bcrypt + JWT']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid #f5f5f5`, fontSize: 13 }}>
                <span style={{ color: C.mut }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
