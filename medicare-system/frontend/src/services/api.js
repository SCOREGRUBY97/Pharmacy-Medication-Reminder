// ============================================================
// API Service — Connects React Frontend to Node.js Backend
// All HTTP calls go through this file using axios
// Base URL: http://localhost:5000/api  (from .env)
// ============================================================

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Create Axios Instance ────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Request Interceptor — attach JWT token ───────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medicare_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — handle 401 globally ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medicare_token');
      localStorage.removeItem('medicare_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
  register: (data)        => api.post('/auth/register', data),
  login:    (data)        => api.post('/auth/login', data),
  logout:   ()            => api.post('/auth/logout'),
  getMe:    ()            => api.get('/auth/me'),
  resetPwd: (email)       => api.post('/auth/reset-password', { email }),
};

// ============================================================
// MEDICATIONS API
// ============================================================
export const medicationAPI = {
  getAll:   ()            => api.get('/medicines'),
  getById:  (id)          => api.get(`/medicines/${id}`),
  add:      (data)        => api.post('/medicines', data),
  update:   (id, data)    => api.put(`/medicines/${id}`, data),
  delete:   (id)          => api.delete(`/medicines/${id}`),
};

// ============================================================
// REMINDERS API
// ============================================================
export const reminderAPI = {
  getToday:         ()            => api.get('/reminders/today'),
  getHistory:       (params)      => api.get('/reminders/history', { params }),
  getAdherence:     (params)      => api.get('/reminders/adherence-summary', { params }),
  updateStatus:     (id, data)    => api.patch(`/reminders/${id}/status`, data),
};

// ============================================================
// DASHBOARD API
// ============================================================
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ============================================================
// CAREGIVER API
// ============================================================
export const caregiverAPI = {
  link:             (data)        => api.post('/caregiver/link', data),
  getMyCaregivers:  ()            => api.get('/caregiver/my-caregivers'),
  remove:           (id)          => api.delete(`/caregiver/${id}`),
  getMyPatients:    ()            => api.get('/caregiver/patients'),
  getPatientSchedule: (patientId) => api.get(`/caregiver/patients/${patientId}/schedule`),
};

// ============================================================
// ADMIN API
// ============================================================
export const adminAPI = {
  getUsers:     (params)  => api.get('/admin/users', { params }),
  deactivate:   (id)      => api.patch(`/admin/users/${id}/deactivate`),
  getStats:     ()        => api.get('/admin/stats'),
};

// ============================================================
// AI ASSISTANT API
// ============================================================
export const aiAPI = {
  ask: (data) => api.post('/ai/advice', data),
};

export default api;
