import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network Error';
    return Promise.reject(new Error(msg));
  }
);

export const login          = d => API.post('/auth/login', d);
export const register       = d => API.post('/auth/register', d);
export const getMe          = () => API.get('/auth/me');
export const updateProfile  = d => API.put('/auth/profile', d);
export const changePassword = d => API.put('/auth/password', d);

export const getMedications   = p => API.get('/medications', { params: p });
export const addMedication    = d => API.post('/medications', d);
export const updateMedication = (id, d) => API.put(`/medications/${id}`, d);
export const deleteMedication = id => API.delete(`/medications/${id}`);

export const getReminders  = p => API.get('/reminders', { params: p });
export const getReminderStats   = () => API.get('/reminders/stats');
export const getReminderHistory = p => API.get('/reminders/history', { params: p });
export const updateStatus  = (id, d) => API.patch(`/reminders/${id}/status`, d);

export const getNotifications  = () => API.get('/notifications');
export const markNotifRead     = id => API.patch(`/notifications/${id}/read`);
export const markAllRead       = () => API.patch('/notifications/read-all');

export const getPatients        = () => API.get('/caregiver/patients');
export const getPatientOverview = id => API.get(`/caregiver/patients/${id}/overview`);
export const linkPatient        = d => API.post('/caregiver/link', d);
export const unlinkPatient      = id => API.delete(`/caregiver/unlink/${id}`);

export const getAdminStats    = () => API.get('/admin/stats');
export const getAllUsers       = p => API.get('/admin/users', { params: p });
export const updateUser       = (id, d) => API.put(`/admin/users/${id}`, d);
export const deactivateUser   = id => API.delete(`/admin/users/${id}`);
export const getAllMedications = () => API.get('/admin/medications');
export const getAdherenceReport = () => API.get('/admin/reports');
