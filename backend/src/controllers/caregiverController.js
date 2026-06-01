const { query } = require('../config/db');

const checkAccess = async (caregiverId, patientId) => {
  const r = await query(
    'SELECT id FROM caregiver_patients WHERE caregiver_id=$1 AND patient_id=$2 AND is_active=true',
    [caregiverId, patientId]);
  return r.rows.length > 0;
};

// GET /api/caregiver/patients
const getPatients = async (req, res) => {
  try {
    const r = await query(`
      SELECT u.id,u.full_name,u.email,u.phone,u.last_seen,u.medical_conditions,
             cp.relationship,cp.linked_at,
             COUNT(DISTINCT m.id) FILTER(WHERE m.is_active) AS med_count,
             COUNT(r.id) FILTER(WHERE r.scheduled_date=CURRENT_DATE) AS today_total,
             COUNT(r.id) FILTER(WHERE r.scheduled_date=CURRENT_DATE AND r.status='taken') AS today_taken,
             COUNT(r.id) FILTER(WHERE r.scheduled_date=CURRENT_DATE AND r.status='missed') AS today_missed,
             COUNT(r.id) FILTER(WHERE r.scheduled_date=CURRENT_DATE AND r.status='pending') AS today_pending,
             ROUND(COUNT(r.id) FILTER(WHERE r.status='taken')*100.0/NULLIF(COUNT(r.id),0),1) AS adherence_pct
      FROM caregiver_patients cp
      JOIN users u ON cp.patient_id=u.id
      LEFT JOIN medications m ON m.user_id=u.id
      LEFT JOIN reminders r ON r.user_id=u.id AND r.scheduled_date>=CURRENT_DATE-7
      WHERE cp.caregiver_id=$1 AND cp.is_active=true AND u.is_active=true
      GROUP BY u.id,cp.relationship,cp.linked_at
      ORDER BY today_missed DESC, u.full_name`, [req.user.id]);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch patients' }); }
};

// GET /api/caregiver/patients/:id/overview
const getPatientOverview = async (req, res) => {
  try {
    if (!await checkAccess(req.user.id, req.params.id) && req.user.role!=='admin')
      return res.status(403).json({ error: 'Not authorized' });
    const [profile, meds, reminders, history] = await Promise.all([
      query(`SELECT id,full_name,email,phone,date_of_birth,gender,medical_conditions,
               allergies,doctor_name,last_seen FROM users WHERE id=$1`, [req.params.id]),
      query(`SELECT * FROM medications WHERE user_id=$1 AND is_active=true ORDER BY category`, [req.params.id]),
      query(`SELECT r.*,m.name AS med_name,m.dosage FROM reminders r JOIN medications m ON r.medication_id=m.id
               WHERE r.user_id=$1 AND r.scheduled_date=CURRENT_DATE ORDER BY r.scheduled_time`, [req.params.id]),
      query(`SELECT scheduled_date AS date,
               COUNT(*) FILTER(WHERE status='taken') AS taken,
               COUNT(*) FILTER(WHERE status='missed') AS missed,
               COUNT(*) AS total
             FROM reminders WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-7
             GROUP BY scheduled_date ORDER BY scheduled_date DESC`, [req.params.id]),
    ]);
    res.json({ profile: profile.rows[0], medications: meds.rows, reminders: reminders.rows, history: history.rows });
  } catch { res.status(500).json({ error: 'Failed to fetch patient overview' }); }
};

// POST /api/caregiver/link
const linkPatient = async (req, res) => {
  const { patient_email, relationship } = req.body;
  if (!patient_email) return res.status(400).json({ error: 'Patient email required' });
  try {
    const patient = await query(
      `SELECT id,full_name FROM users WHERE email=$1 AND role='patient' AND is_active=true`,
      [patient_email.toLowerCase()]);
    if (!patient.rows.length) return res.status(404).json({ error: 'No active patient found with that email' });
    if (patient.rows[0].id===req.user.id) return res.status(400).json({ error: 'Cannot link yourself' });
    await query(`INSERT INTO caregiver_patients(caregiver_id,patient_id,relationship)
      VALUES($1,$2,$3) ON CONFLICT(caregiver_id,patient_id) DO UPDATE SET is_active=true,relationship=$3`,
      [req.user.id, patient.rows[0].id, relationship||'Caregiver']);
    res.json({ message: `Successfully linked to ${patient.rows[0].full_name}!`, patient: patient.rows[0] });
  } catch { res.status(500).json({ error: 'Failed to link patient' }); }
};

// DELETE /api/caregiver/link/:patient_id
const unlinkPatient = async (req, res) => {
  try {
    await query('UPDATE caregiver_patients SET is_active=false WHERE caregiver_id=$1 AND patient_id=$2',
      [req.user.id, req.params.patient_id]);
    res.json({ message: 'Patient unlinked' });
  } catch { res.status(500).json({ error: 'Failed to unlink patient' }); }
};

// GET /api/caregiver/alerts
const getAlerts = async (req, res) => {
  try {
    const patients = await query(
      'SELECT patient_id FROM caregiver_patients WHERE caregiver_id=$1 AND is_active=true', [req.user.id]);
    const patientIds = patients.rows.map(p => p.patient_id);
    if (!patientIds.length) return res.json([]);
    const r = await query(`
      SELECT n.*,u.full_name AS patient_name FROM notifications n
      JOIN users u ON n.user_id=u.id
      WHERE n.user_id=ANY($1) AND n.type IN('missed','caregiver_alert')
      ORDER BY n.sent_at DESC LIMIT 50`, [patientIds]);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch alerts' }); }
};

module.exports = { getPatients, getPatientOverview, linkPatient, unlinkPatient, getAlerts };
