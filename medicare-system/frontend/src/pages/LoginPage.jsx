import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const input = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D3D1C7', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const label = { fontSize: 13, fontWeight: 600, color: '#5F5E5A', display: 'block', marginBottom: 6 };

export default function LoginPage() {
  const { register, login, error } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone_number: '' });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setFormError('');
    if (!form.email || !form.password) return setFormError('Email and password are required.');
    if (isRegister && !form.full_name) return setFormError('Full name is required.');

    setLoading(true);
    const result = isRegister
      ? await register({ ...form, role })
      : await login({ email: form.email, password: form.password });
    setLoading(false);

    if (result.success) navigate('/dashboard');
    else setFormError(result.message || error || 'Something went wrong.');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #085041, #0F6E56, #1D9E75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: 400, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: '#0F6E56', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>💊</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>MediCare Reminder</h2>
          <p style={{ color: '#5F5E5A', margin: '4px 0 0', fontSize: 13 }}>Pharmacy Medication Assistant</p>
        </div>

        {/* Role selector */}
        <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
          {['patient', 'caregiver', 'admin'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: role === r ? '#fff' : 'transparent', color: role === r ? '#0F6E56' : '#888', textTransform: 'capitalize' }}>{r}</button>
          ))}
        </div>

        {/* Error message */}
        {formError && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {formError}
          </div>
        )}

        {/* Form fields */}
        {isRegister && (
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Full Name</label>
            <input style={input} placeholder="Sarah Johnson" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={label}>Email Address</label>
          <input style={input} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>

        {isRegister && (
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Phone Number</label>
            <input style={input} type="tel" placeholder="+61 400 000 000" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={label}>Password</label>
          <input style={input} type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: 13, background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 16 }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span style={{ color: '#0F6E56', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setIsRegister(!isRegister); setFormError(''); }}>
            {isRegister ? 'Sign In' : 'Register Now'}
          </span>
        </p>
      </div>
    </div>
  );
}
