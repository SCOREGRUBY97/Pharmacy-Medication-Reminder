const { query } = require('../config/db');

const getPatients = async (req, res) => {
  try {
    const r = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.last_login, cp.relationship,
              COUNT(DISTINCT m.id) FILTER(WHERE m.is_active) AS med_count,
              COUNT(rem.id) FILTER(WHERE rem.scheduled_date=CURRENT_DATE AND rem.status='missed') AS missed_today,
              ROUND(COUNT(rem.id) FILTER(WHERE rem.status='taken')*100.0/NULLIF(COUNT(rem.id),0),1) AS adherence_pct
       FROM caregiver_patients cp
       JOIN users u ON cp.patient_id=u.id
       LEFT JOIN medications m ON m.user_id=u.id
       LEFT JOIN reminders rem ON rem.user_id=u.id AND rem.scheduled_date>=CURRENT_DATE-7
       WHERE cp.caregiver_id=$1 AND cp.is_active=true AND u.is_active=true
       GROUP BY u.id, cp.relationship ORDER BY u.full_name`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getPatientOverview = async (req, res) => {
  try {
    const [profile, meds, reminders, history] = await Promise.all([
      query('SELECT id,full_name,email,phone,last_login FROM users WHERE id=$1', [req.params.id]),
      query('SELECT * FROM medications WHERE user_id=$1 AND is_active=true ORDER BY created_at DESC', [req.params.id]),
      query(`SELECT r.*,m.name AS med_name,m.dosage FROM reminders r JOIN medications m ON r.medication_id=m.id WHERE r.user_id=$1 AND r.scheduled_date=CURRENT_DATE ORDER BY r.scheduled_time`, [req.params.id]),
      query(`SELECT scheduled_date AS date, COUNT(*) FILTER(WHERE status='taken') AS taken, COUNT(*) FILTER(WHERE status='missed') AS missed, COUNT(*) AS total FROM reminders WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-7 GROUP BY scheduled_date ORDER BY scheduled_date DESC`, [req.params.id]),
    ]);
    res.json({ profile: profile.rows[0], medications: meds.rows, reminders: reminders.rows, history: history.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const linkPatient = async (req, res) => {
  try {
    const { patient_email, relationship } = req.body;
    const pat = await query(`SELECT id,full_name FROM users WHERE email=$1 AND role='patient' AND is_active=true`, [patient_email?.toLowerCase()]);
    if (!pat.rows.length) return res.status(404).json({ error: 'No patient found with that email' });
    await query(`INSERT INTO caregiver_patients (caregiver_id,patient_id,relationship) VALUES ($1,$2,$3) ON CONFLICT (caregiver_id,patient_id) DO UPDATE SET is_active=true, relationship=$3`,
      [req.user.id, pat.rows[0].id, relationship||'Caregiver']);
    res.json({ message: `Linked to ${pat.rows[0].full_name}!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const unlinkPatient = async (req, res) => {
  try {
    await query('UPDATE caregiver_patients SET is_active=false WHERE caregiver_id=$1 AND patient_id=$2', [req.user.id, req.params.id]);
    res.json({ message: 'Unlinked' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getPatients, getPatientOverview, linkPatient, unlinkPatient };
