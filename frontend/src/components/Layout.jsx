import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = {
  patient:   [['dashboard','⊞','Dashboard'],['medications','💊','Medications'],['reminders','🔔','Reminders'],['history','📊','History'],['caregiver','👥','My Caregiver'],['ai','🤖','AI Assistant'],['profile','⚙️','Profile']],
  caregiver: [['patients','👥','My Patients'],['alerts','🔔','Alerts'],['reports','📊','Reports'],['link','🔗','Link Patient'],['profile','⚙️','Profile']],
  admin:     [['dashboard','⊞','Dashboard'],['users','👥','All Users'],['medications','💊','All Medications'],['reports','📊','Reports'],['settings','⚙️','Settings']],
};

const BG = { patient:'#052e16', caregiver:'#0c1a3d', admin:'#1a0a2e' };
const AC = { patient:'#16A34A', caregiver:'#2563EB', admin:'#7C3AED' };

export default function Layout({ children, pendingCount = 0 }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'patient';
  const bg   = BG[role];
  const ac   = AC[role];
  const nav  = NAV[role] || NAV.patient;
  const init = user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'U';

  const [page, setPage] = useState(nav[0][0]);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F3F4F6' }}>
      {/* Sidebar */}
      <div style={{ width:220, background:bg, display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex:100, boxShadow:'2px 0 12px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
            <div style={{ width:32, height:32, background:ac, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>💊</div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:14, fontFamily:'Plus Jakarta Sans,Inter,sans-serif' }}>MediCare PRO</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, textTransform:'capitalize' }}>{role} portal</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.07)', borderRadius:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:ac, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:600, flexShrink:0 }}>{init}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ color:'#fff', fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name?.split(' ')[0]}</div>
              <div style={{ color:'rgba(255,255,255,0.38)', fontSize:9, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          </div>
        </div>

        <nav style={{ padding:'10px 10px', flex:1, overflowY:'auto' }}>
          <div style={{ color:'rgba(255,255,255,0.25)', fontSize:9, fontWeight:600, letterSpacing:1.2, padding:'4px 2px 8px', textTransform:'uppercase' }}>Navigation</div>
          {nav.map(([id, ic, label]) => {
            const active = page === id;
            const badge  = id === 'reminders' && pendingCount > 0 ? pendingCount : 0;
            return (
              <div key={id} onClick={()=>setPage(id)} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:active?500:400, color:active?'#fff':'rgba(255,255,255,0.58)', background:active?'rgba(255,255,255,0.12)':'transparent', borderLeft:active?`3px solid ${ac}`:'3px solid transparent', transition:'all 0.15s', marginBottom:1 }}>
                <span style={{ fontSize:14, width:20, textAlign:'center' }}>{ic}</span>
                <span style={{ flex:1 }}>{label}</span>
                {badge > 0 && <span style={{ background:'#DC2626', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:20 }}>{badge}</span>}
              </div>
            );
          })}
        </nav>

        <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={logout} style={{ width:'100%', padding:'7px 10px', borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'Inter,sans-serif' }}>
            🚪 Sign out
          </button>
          <div style={{ color:'rgba(255,255,255,0.18)', fontSize:10, marginTop:6, textAlign:'center' }}>MediCare PRO v2.0</div>
        </div>
      </div>

      {/* Main */}
      <main style={{ marginLeft:220, flex:1, minWidth:0, minHeight:'100vh' }}>
        {children(page, setPage)}
      </main>
    </div>
  );
}
