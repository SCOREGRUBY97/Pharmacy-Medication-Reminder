import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');

  const handle = async () => {
    if (!form.email || !form.password) { setError('Email and password required'); return; }
    try {
      await login({ ...form, role });
    } catch (e) {
      setError(e.message || 'Login failed');
    }
  };

  const s = {
    wrap: { minHeight: '100vh', background: 'linear-gradient(135deg,#085041,#0F6E56,#1D9E75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    box: { background: '#fff', borderRadius: 20, padding: '36px 32px', width: 380, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
    icon: { width: 52, height: 52, background: '#0F6E56', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 },
    title: { textAlign: 'center', marginBottom: 24 },
    tabs: { display: 'flex', background: '#f5f5f5', borderRadius: 10, padding: 4, marginBottom: 18 },
    tab: (active) => ({ flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: active ? '#fff' : 'transparent', color: active ? '#0F6E56' : '#888', textTransform: 'capitalize' }),
    label: { fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5, marginTop: 12 },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: '#0F6E56', color: '#fff', marginTop: 14 },
    error: { color: '#E24B4A', fontSize: 12, textAlign: 'center', marginTop: 8 },
    toggle: { textAlign: 'center', fontSize: 13, color: '#888', marginTop: 14 },
    link: { color: '#0F6E56', cursor: 'pointer', fontWeight: 600 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.title}>
          <div style={s.icon}>💊</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Pharmacy Medication Reminder</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>Manage your medications easily</p>
        </div>
        <div style={s.tabs}>
          {['patient', 'caregiver', 'admin'].map(r => (
            <button key={r} style={s.tab(role === r)} onClick={() => setRole(r)}>{r}</button>
          ))}
        </div>
        {isRegister && (<><label style={s.label}>Full Name</label><input style={s.input} placeholder="Sarah Johnson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></>)}
        <label style={s.label}>Email Address</label>
        <input style={s.input} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        {isRegister && (<><label style={s.label}>Phone Number</label><input style={s.input} type="tel" placeholder="+61 400 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></>)}
        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        {error && <p style={s.error}>{error}</p>}
        <button style={s.btn} onClick={handle}>{isRegister ? 'Create Account' : 'Sign In'}</button>
        <p style={s.toggle}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span style={s.link} onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Sign In' : 'Register'}</span>
        </p>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 8 }}>Demo: any email + password works</p>
      </div>
    </div>
  );
}
