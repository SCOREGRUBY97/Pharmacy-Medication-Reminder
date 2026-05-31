import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState('login');
  const [role, setRole]     = useState('patient');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Use refs instead of state to avoid React batching issues
  const emailRef    = useRef('');
  const passwordRef = useRef('');
  const nameRef     = useRef('');
  const phoneRef    = useRef('');

  const submit = async () => {
    const email    = emailRef.current;
    const password = passwordRef.current;
    const fullName = nameRef.current;

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password.trim());
      } else {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phoneRef.current,
          role,
        });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #E5E7EB', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', color: '#111827',
    background: '#fff', boxSizing: 'border-box',
    marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "Inter,'Segoe UI',sans-serif" }}>
      {/* Left side */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg,#052e16,#0F6E56,#1D9E75)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', color: '#fff' }}>
        <div style={{ width: 56, height: 56, background: '#EF9F27', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 24 }}>💊</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', fontFamily: 'Plus Jakarta Sans,Inter,sans-serif' }}>MediCare PRO</h1>
        <p style={{ fontSize: 16, opacity: 0.85, margin: '0 0 40px', lineHeight: 1.6 }}>Your intelligent pharmacy medication reminder system with real-time notifications</p>
        {[['🔔','Real-time reminders','Get push notifications on your laptop & phone'],['👥','3 role hierarchy','Patient, Caregiver & Admin portals'],['📧','Email alerts','Automatic emails when doses are due or missed'],['🤖','AI assistant','Get medication advice and doctor recommendations']].map(([ic,t,d]) => (
          <div key={t} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ic}</div>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div><div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{d}</div></div>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px' }}>{mode === 'login' ? 'Sign in to your MediCare account' : 'Join MediCare to manage your medications'}</p>

          {mode === 'register' && (
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 3, marginBottom: 20, gap: 3 }}>
              {['patient','caregiver'].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: role===r ? '#fff' : 'transparent', color: role===r ? '#0F6E56' : '#6B7280', textTransform: 'capitalize', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {r === 'patient' ? '👤' : '❤️'} {r}
                </button>
              ))}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full name</label>
              <input style={inp} placeholder="Sarah Johnson" onChange={e => nameRef.current = e.target.value} onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          )}

          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email address</label>
          <input style={inp} type="email" placeholder="you@example.com" onChange={e => emailRef.current = e.target.value} onKeyDown={e => e.key === 'Enter' && submit()} />

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Phone (for SMS alerts)</label>
              <input style={inp} type="tel" placeholder="+61 400 000 000" onChange={e => phoneRef.current = e.target.value} />
            </div>
          )}

          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
          <input style={{ ...inp, marginBottom: 0 }} type="password" placeholder="Min. 8 characters" onChange={e => passwordRef.current = e.target.value} onKeyDown={e => e.key === 'Enter' && submit()} />

          {mode === 'login' && (
            <div style={{ textAlign: 'right', margin: '6px 0 18px' }}>
              <button onClick={() => setError('Contact admin to reset your password')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0F6E56', fontWeight: 600 }}>Forgot password?</button>
            </div>
          )}

          {mode === 'register' && <div style={{ marginBottom: 18 }} />}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#052e16,#0F6E56)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', marginBottom: 16, boxShadow: '0 4px 14px rgba(15,110,86,0.25)' }}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F6E56', fontWeight: 700, fontSize: 13 }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
