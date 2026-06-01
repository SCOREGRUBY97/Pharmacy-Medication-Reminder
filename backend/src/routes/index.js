const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const auth   = require('../controllers/authController');
const meds   = require('../controllers/medicationController');
const rems   = require('../controllers/reminderController');
const cg     = require('../controllers/caregiverController');
const adm    = require('../controllers/adminController');
const { query } = require('../config/db');

const router = express.Router();
const adminOnly     = requireRole('admin');
const caregiverUp   = requireRole('caregiver','admin');

// ─── HEALTH ──────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── AUTH ────────────────────────────────────────────────────
router.post('/auth/register',          auth.register);
router.post('/auth/login',             auth.login);
router.post('/auth/logout',            authenticate, auth.logout);
router.post('/auth/forgot-password',   auth.forgotPassword);
router.post('/auth/reset-password',    auth.resetPassword);
router.get('/auth/me',                 authenticate, auth.getMe);
router.put('/auth/profile',            authenticate, auth.updateProfile);
router.put('/auth/password',           authenticate, auth.changePassword);
router.post('/auth/push-subscribe',    authenticate, auth.savePushSubscription);
router.delete('/auth/push-subscribe',  authenticate, auth.removePushSubscription);

// ─── MEDICATIONS ─────────────────────────────────────────────
router.get('/medications',             authenticate, meds.getMedications);
router.get('/medications/:id',         authenticate, meds.getMedication);
router.post('/medications',            authenticate, meds.addMedication);
router.put('/medications/:id',         authenticate, meds.updateMedication);
router.delete('/medications/:id',      authenticate, meds.deleteMedication);
router.patch('/medications/:id/stock', authenticate, meds.updateStock);

// ─── REMINDERS ───────────────────────────────────────────────
router.get('/reminders',               authenticate, rems.getReminders);
router.get('/reminders/stats',         authenticate, rems.getStats);
router.get('/reminders/history',       authenticate, rems.getHistory);
router.patch('/reminders/:id/status',  authenticate, rems.updateStatus);

// ─── NOTIFICATIONS ───────────────────────────────────────────
router.get('/notifications', authenticate, async (req, res) => {
  const r = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY sent_at DESC LIMIT 30', [req.user.id]);
  res.json(r.rows);
});
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  await query('UPDATE notifications SET is_read=true,read_at=NOW() WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Marked read' });
});
router.patch('/notifications/read-all', authenticate, async (req, res) => {
  await query('UPDATE notifications SET is_read=true,read_at=NOW() WHERE user_id=$1 AND is_read=false', [req.user.id]);
  res.json({ message: 'All marked read' });
});

// ─── CAREGIVER ───────────────────────────────────────────────
router.get('/caregiver/patients',              authenticate, caregiverUp, cg.getPatients);
router.get('/caregiver/patients/:id/overview', authenticate, caregiverUp, cg.getPatientOverview);
router.get('/caregiver/alerts',                authenticate, caregiverUp, cg.getAlerts);
router.post('/caregiver/link',                 authenticate, caregiverUp, cg.linkPatient);
router.delete('/caregiver/link/:patient_id',   authenticate, caregiverUp, cg.unlinkPatient);

// ─── ADMIN ───────────────────────────────────────────────────
router.get('/admin/stats',             authenticate, adminOnly, adm.getStats);
router.get('/admin/users',             authenticate, adminOnly, adm.getAllUsers);
router.post('/admin/users',            authenticate, adminOnly, adm.createUser);
router.put('/admin/users/:id',         authenticate, adminOnly, adm.updateUser);
router.delete('/admin/users/:id',      authenticate, adminOnly, adm.deactivateUser);
router.get('/admin/medications',       authenticate, adminOnly, adm.getAllMedications);
router.get('/admin/audit-logs',        authenticate, adminOnly, adm.getAuditLogs);
router.get('/admin/reports/adherence', authenticate, adminOnly, adm.adherenceReport);

module.exports = router;
