import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── AUTH ────────────────────────────────────────────────────
export const register          = (d)     => API.post('/auth/register', d);
export const login             = (d)     => API.post('/auth/login', d);
export const forgotPassword    = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword     = (d)     => API.post('/auth/reset-password', d);
export const getMe             = ()      => API.get('/auth/me');
export const updateProfile     = (d)     => API.put('/auth/profile', d);
export const changePassword    = (d)     => API.put('/auth/password', d);
export const savePushSub       = (sub)   => API.post('/auth/push-subscribe', { subscription: sub });
export const removePushSub     = ()      => API.delete('/auth/push-subscribe');

// ─── MEDICATIONS ─────────────────────────────────────────────
export const getMedications    = (p)     => API.get('/medications', { params: p });
export const getMedication     = (id)    => API.get(`/medications/${id}`);
export const addMedication     = (d)     => API.post('/medications', d);
export const updateMedication  = (id,d)  => API.put(`/medications/${id}`, d);
export const deleteMedication  = (id)    => API.delete(`/medications/${id}`);
export const updateStock       = (id,s)  => API.patch(`/medications/${id}/stock`, { current_stock: s });

// ─── REMINDERS ───────────────────────────────────────────────
export const getReminders      = (p)     => API.get('/reminders', { params: p });
export const getReminderStats  = (p)     => API.get('/reminders/stats', { params: p });
export const getReminderHistory= (p)     => API.get('/reminders/history', { params: p });
export const updateStatus      = (id,d)  => API.patch(`/reminders/${id}/status`, d);

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const getNotifications  = ()      => API.get('/notifications');
export const markNotifRead     = (id)    => API.patch(`/notifications/${id}/read`);
export const markAllRead       = ()      => API.patch('/notifications/read-all');

// ─── CAREGIVER ───────────────────────────────────────────────
export const getMyPatients = () =>
  API.get('/caregiver/patients');

export const getPatientOverview = (id) =>
  API.get(`/caregiver/patients/${id}/overview`);

export const getCaregiverAlerts = () =>
  API.get('/caregiver/alerts');

export const linkPatient = (d) =>
  API.post('/caregiver/link', d);

export const sendPatientAlert = (d) =>
  API.post('/caregiver/alert-patient', d);

export const unlinkPatient = (id) =>
  API.delete(`/caregiver/link/${id}`);

export const getMyCaregivers = () =>
  API.get('/patient/caregivers');

export const linkCaregiver = (d) =>
  API.post('/patient/link-caregiver', d);

export const unlinkCaregiver = (id) =>
  API.delete(`/patient/link-caregiver/${id}`);

// ─── ADMIN ───────────────────────────────────────────────────
export const getAdminStats      = ()     => API.get('/admin/stats');
export const getAllUsers         = (p)    => API.get('/admin/users', { params: p });
export const createUser         = (d)    => API.post('/admin/users', d);
export const updateUser         = (id,d) => API.put(`/admin/users/${id}`, d);
export const deactivateUser     = (id)   => API.delete(`/admin/users/${id}`);
export const getAllMedications   = ()    => API.get('/admin/medications');
export const getAuditLogs       = ()     => API.get('/admin/audit-logs');
export const getAdherenceReport = ()     => API.get('/admin/reports/adherence');

export default API;
