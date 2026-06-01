import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { C, S } from '../constants/styles';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const emailRef = useRef('');
  const passRef  = useRef('');
  const nameRef  = useRef('');
  const phoneRef = useRef('');

  const go = async () => {
    const email = emailRef.current;
    const pass  = passRef.current;
    if (!email || !pass) { setError('Please enter your email and password'); return; }
    setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, pass);
      } else {
        const name = nameRef.current;
        if (!name) { setError('Please enter your full name'); setBusy(false); return; }
        await register({ full_name: name, email, password: pass, phone: phoneRef.current, role });
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Something went wrong');
    }
    setBusy(false);
  };

  const inp = { width:'100%', padding:'11px 14px', borderRadius:9, border:'1.5px solid #D1D5DB', fontSize:14, fontFamily:'inherit', outline:'none', color:'#111827', background:'#fff', boxSizing:'border-box', marginBottom:12 };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ flex:1, background:'linear-gradient(160deg,#052e16 0%,#0F6E56 60%,#1D9E75 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'52px 48px', color:'#fff' }}>
        <div style={{ width:54, height:54, background:'#EF9F27', borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:22 }}>💊</div>
        <h1 style={{ fontSize:34, fontWeight:800, margin:'0 0 10px', fontFamily:'Plus Jakarta Sans,Inter,sans-serif' }}>MediCare PRO</h1>
        <p style={{ fontSize:15, opacity:0.8, margin:'0 0 38px', lineHeight:1.6 }}>Your intelligent pharmacy medication reminder system</p>
        {[['🔔','Real-time reminders','Push notifications on your devices'],['👥','3 role system','Patient, Caregiver & Admin portals'],['📧','Email alerts','Automatic alerts for missed doses'],['🤖','AI assistant','Medication advice & doctor recommendations']].map(([ic,t,d]) => (
          <div key={t} style={{ display:'flex', gap:13, marginBottom:18 }}>
            <div style={{ width:34, height:34, background:'rgba(255,255,255,0.15)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{ic}</div>
            <div><div style={{ fontWeight:600, fontSize:13 }}>{t}</div><div style={{ fontSize:12, opacity:0.65, marginTop:2 }}>{d}</div></div>
          </div>
        ))}
      </div>

      <div style={{ width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:'#FAFAFA' }}>
        <div style={{ width:'100%', maxWidth:370, background:'#fff', borderRadius:16, padding:'32px 28px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize:24, fontWeight:700, margin:'0 0 4px', color:'#111827' }}>{mode==='login'?'Welcome back':'Create account'}</h2>
          <p style={{ color:'#6B7280', fontSize:13, margin:'0 0 24px' }}>{mode==='login'?'Sign in to your MediCare account':'Join MediCare to manage your medications'}</p>

          {mode==='register' && (
            <div style={{ display:'flex', background:'#F3F4F6', borderRadius:9, padding:3, marginBottom:18, gap:3 }}>
              {['patient','caregiver'].map(r => (
                <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:'7px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background:role===r?'#fff':'transparent', color:role===r?'#0F6E56':'#6B7280', textTransform:'capitalize', fontFamily:'inherit' }}>
                  {r==='patient'?'👤':'❤️'} {r}
                </button>
              ))}
            </div>
          )}

          {mode==='register' && <>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Full name</label>
            <input style={inp} placeholder="Sarah Johnson" onChange={e=>nameRef.current=e.target.value} onKeyDown={e=>e.key==='Enter'&&go()} />
          </>}

          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email address</label>
          <input style={inp} type="email" placeholder="you@example.com" onChange={e=>emailRef.current=e.target.value} onKeyDown={e=>e.key==='Enter'&&go()} />

          {mode==='register' && <>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Phone (optional)</label>
            <input style={inp} type="tel" placeholder="+61 400 000 000" onChange={e=>phoneRef.current=e.target.value} />
          </>}

          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Password</label>
          <input style={{ ...inp, marginBottom:16 }} type="password" placeholder="Min. 6 characters" onChange={e=>passRef.current=e.target.value} onKeyDown={e=>e.key==='Enter'&&go()} />

          {error && <div style={{ padding:'9px 13px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}

          <button onClick={go} disabled={busy} style={{ width:'100%', padding:12, borderRadius:10, border:'none', cursor:busy?'not-allowed':'pointer', background:busy?'#9CA3AF':'linear-gradient(135deg,#052e16,#0F6E56)', color:'#fff', fontSize:14, fontWeight:700, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(15,110,86,0.25)', marginBottom:14 }}>
            {busy?'⏳ Please wait...':mode==='login'?'🔐 Sign In':'🚀 Create Account'}
          </button>

          <p style={{ textAlign:'center', fontSize:13, color:'#6B7280', margin:0 }}>
            {mode==='login'?"Don't have an account? ":"Already have an account? "}
            <span onClick={()=>{setMode(m=>m==='login'?'register':'login');setError('');}} style={{ color:'#0F6E56', cursor:'pointer', fontWeight:600 }}>
              {mode==='login'?'Register':'Sign In'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
