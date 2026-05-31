import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { C } from '../constants/styles';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode]   = useState('login');
  const [role, setRole]   = useState('patient');
  const [form, setForm]   = useState({ full_name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    if (mode === 'register' && !form.full_name) { setError('Full name is required'); return; }
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register({ ...form, role });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.brd}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: C.txt, background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.15s' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: `linear-gradient(145deg, ${C.priDk} 0%, ${C.pri} 50%, ${C.priLt} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(239,159,39,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', maxWidth: 360 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>💊</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: '#fff' }}>MediCare PRO</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 32 }}>Your intelligent pharmacy medication reminder system with real-time notifications</p>
          {[['Real-time reminders', 'Get push notifications on your laptop & phone'],
            ['3 role hierarchy', 'Patient, Caregiver & Admin portals'],
            ['Email alerts', 'Automatic emails when doses are due or missed'],
            ['AI assistant', 'Get medication advice and doctor recommendations']
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, textAlign: 'left' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <i className="ti ti-check" style={{ color: '#fff', fontSize: 11 }} aria-hidden="true" />
              </div>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{ width: 440, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 36px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ fontSize: 13, color: C.mut, marginBottom: 24 }}>{mode === 'login' ? 'Sign in to your MediCare account' : 'Join MediCare to manage your medications'}</p>

          {/* Role tabs */}
          {mode === 'register' && (
            <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 10, padding: 3, marginBottom: 18, gap: 3 }}>
              {['patient', 'caregiver'].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: role === r ? '#fff' : 'transparent', color: role === r ? C.pri : C.mut, textTransform: 'capitalize', boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                  <i className={`ti ${r === 'patient' ? 'ti-user' : 'ti-heart'}`} style={{ marginRight: 5, fontSize: 12 }} aria-hidden="true" />
                  {r}
                </button>
              ))}
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Full name</label>
              <input style={inputStyle} placeholder="Sarah Johnson" value={form.full_name} onChange={set('full_name')} onFocus={e => e.target.style.borderColor = C.pri} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Email address</label>
            <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onFocus={e => e.target.style.borderColor = C.pri} onBlur={e => e.target.style.borderColor = C.brd} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Phone (for SMS alerts)</label>
              <input style={inputStyle} type="tel" placeholder="+61 400 000 000" value={form.phone} onChange={set('phone')} onFocus={e => e.target.style.borderColor = C.pri} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          )}

          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Password</label>
            <input style={inputStyle} type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} onFocus={e => e.target.style.borderColor = C.pri} onBlur={e => e.target.style.borderColor = C.brd} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 18, marginTop: 6 }}>
              <button onClick={() => alert('Enter your email above and click Forgot Password')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.pri, fontWeight: 600 }}>Forgot password?</button>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: C.danLt, border: `1px solid ${C.dan}`, color: C.danDk, fontSize: 13, marginBottom: 14 }}>
              <i className="ti ti-alert-circle" style={{ marginRight: 6, fontSize: 14 }} aria-hidden="true" />{error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? C.brd : `linear-gradient(135deg, ${C.priDk}, ${C.pri})`, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginBottom: 16, boxShadow: '0 4px 14px rgba(15,110,86,0.25)', transition: 'all 0.15s' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: C.mut }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.pri, fontWeight: 700, fontSize: 13 }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>


        </div>
      </div>
    </div>
  );
}
