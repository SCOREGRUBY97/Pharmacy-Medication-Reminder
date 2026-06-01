import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then(r => setUser(r.data))
      .catch(() => { localStorage.removeItem('token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    const r = await apiLogin({ email, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const register = useCallback(async (data) => {
    setError('');
    const r = await apiRegister(data);
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
