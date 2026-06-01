import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await axios.post(`${API_URL}/auth/login`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (data) => {
    const r = await axios.post(`${API_URL}/auth/register`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => { localStorage.clear(); setUser(null); };
  const updateUser = (u) => setUser(p => ({ ...p, ...u }));

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
