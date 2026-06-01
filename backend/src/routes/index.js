const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const auth  = require('../controllers/authController');
const meds  = require('../controllers/medicationController');
const rems  = require('../controllers/reminderController');
const cg    = require('../controllers/caregiverController');
const adm   = require('../controllers/adminController');
const { query } = require('../config/db');

const router = express.Router();

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login',    auth.login);
router.post('/auth/logout',   authenticate, auth.logout);
router.get('/auth/me',        authenticate, auth.getMe);
router.put('/auth/profile',   authenticate, auth.updateProfile);
router.put('/auth/password',  authenticate, auth.changePassword);

// Medications
router.get('/medications',          authenticate, meds.getMedications);
router.post('/medications',         authenticate, meds.addMedication);
router.put('/medications/:id',      authenticate, meds.updateMedication);
router.delete('/medications/:id',   authenticate, meds.deleteMedication);

// Reminders
router.get('/reminders',              authenticate, rems.getReminders);
router.get('/reminders/stats',        authenticate, rems.getStats);
router.get('/reminders/history',      authenticate, rems.getHistory);
router.patch('/reminders/:id/status', authenticate, rems.updateStatus);

// Notifications
router.get('/notifications', authenticate, async (req, res) => {
  const r = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY sent_at DESC LIMIT 20', [req.user.id]);
  res.json(r.rows);
});
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Read' });
});
router.patch('/notifications/read-all', authenticate, async (req, res) => {
  await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'All read' });
});

// Caregiver
router.get('/caregiver/patients',              authenticate, requireRole('caregiver','admin'), cg.getPatients);
router.get('/caregiver/patients/:id/overview', authenticate, requireRole('caregiver','admin'), cg.getPatientOverview);
router.post('/caregiver/link',                 authenticate, requireRole('caregiver','admin'), cg.linkPatient);
router.delete('/caregiver/unlink/:id',         authenticate, requireRole('caregiver','admin'), cg.unlinkPatient);

// Admin
router.get('/admin/stats',      authenticate, requireRole('admin'), adm.getStats);
router.get('/admin/users',      authenticate, requireRole('admin'), adm.getAllUsers);
router.put('/admin/users/:id',  authenticate, requireRole('admin'), adm.updateUser);
router.delete('/admin/users/:id', authenticate, requireRole('admin'), adm.deactivateUser);
router.get('/admin/medications', authenticate, requireRole('admin'), adm.getAllMedications);
router.get('/admin/reports',     authenticate, requireRole('admin'), adm.getAdherenceReport);

module.exports = router;
