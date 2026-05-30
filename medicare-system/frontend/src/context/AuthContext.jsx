import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Restore session on page load
  useEffect(() => {
    const storedUser  = localStorage.getItem('medicare_user');
    const storedToken = localStorage.getItem('medicare_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const register = async (formData) => {
    setError(null);
    try {
      const res = await authAPI.register(formData);
      const { user, token } = res.data.data;
      localStorage.setItem('medicare_token', token);
      localStorage.setItem('medicare_user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const login = async (formData) => {
    setError(null);
    try {
      const res = await authAPI.login(formData);
      const { user, token } = res.data.data;
      localStorage.setItem('medicare_token', token);
      localStorage.setItem('medicare_user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    localStorage.removeItem('medicare_token');
    localStorage.removeItem('medicare_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
