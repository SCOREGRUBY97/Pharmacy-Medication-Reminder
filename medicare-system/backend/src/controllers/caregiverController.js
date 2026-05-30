const pool = require('../config/db');

// ============================================================
// CAREGIVER CONTROLLER
// ============================================================

// ─── POST /api/caregiver/link ─────────────────────────────────
const linkCaregiver = async (req, res) => {
  const { caregiver_name, caregiver_email, caregiver_phone, relationship } = req.body;
  try {
    const existing = await pool.query(
      'SELECT caregiver_id FROM caregivers WHERE patient_id = $1 AND caregiver_email = $2',
      [req.user.user_id, caregiver_email]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Caregiver already linked.' });

    const result = await pool.query(
      `INSERT INTO caregivers (patient_id, caregiver_name, caregiver_email, caregiver_phone, relationship)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.user_id, caregiver_name, caregiver_email, caregiver_phone, relationship]
    );

    res.status(201).json({ success: true, message: 'Caregiver linked successfully.', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not link caregiver.' });
  }
};

// ─── GET /api/caregiver/my-caregivers ────────────────────────
const getMyCaregivers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM caregivers WHERE patient_id = $1 AND is_active = TRUE',
      [req.user.user_id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch caregivers.' });
  }
};

// ─── DELETE /api/caregiver/:id ────────────────────────────────
const removeCaregiver = async (req, res) => {
  try {
    await pool.query(
      'UPDATE caregivers SET is_active = FALSE WHERE caregiver_id = $1 AND patient_id = $2',
      [req.params.id, req.user.user_id]
    );
    res.status(200).json({ success: true, message: 'Caregiver removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not remove caregiver.' });
  }
};

// ─── GET /api/caregiver/patients (for caregivers) ─────────────
const getMyPatients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.phone_number,
              c.relationship, c.linked_at
       FROM caregivers c
       JOIN users u ON c.patient_id = u.user_id
       WHERE c.caregiver_email = $1 AND c.is_active = TRUE`,
      [req.user.email]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch patients.' });
  }
};

// ─── GET /api/caregiver/patients/:id/schedule ─────────────────
const getPatientSchedule = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    // Verify caregiver is linked to this patient
    const linked = await pool.query(
      'SELECT 1 FROM caregivers WHERE patient_id = $1 AND caregiver_email = $2 AND is_active = TRUE',
      [req.params.id, req.user.email]
    );
    if (linked.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Not authorized to view this patient.' });

    const result = await pool.query(
      `SELECT r.*, m.medication_name, m.dosage
       FROM reminders r
       JOIN medications m ON r.medication_id = m.medication_id
       WHERE r.user_id = $1 AND r.reminder_date = $2
       ORDER BY r.reminder_time ASC`,
      [req.params.id, today]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch patient schedule.' });
  }
};

// ============================================================
// DASHBOARD CONTROLLER
// ============================================================

// ─── GET /api/dashboard ───────────────────────────────────────
const getDashboard = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    // Today's reminders
    const todayReminders = await pool.query(
      `SELECT r.*, m.medication_name, m.dosage, m.instructions
       FROM reminders r
       JOIN medications m ON r.medication_id = m.medication_id
       WHERE r.user_id = $1 AND r.reminder_date = $2
       ORDER BY r.reminder_time ASC`,
      [req.user.user_id, today]
    );

    // Summary counts
    const rows = todayReminders.rows;
    const total   = rows.length;
    const taken   = rows.filter(r => r.status === 'taken').length;
    const missed  = rows.filter(r => r.status === 'missed').length;
    const pending = rows.filter(r => r.status === 'pending').length;

    // 7-day adherence
    const weekStats = await pool.query(
      `SELECT
         reminder_date::text AS date,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'taken') AS taken,
         COUNT(*) FILTER (WHERE status = 'missed') AS missed
       FROM reminders
       WHERE user_id = $1 AND reminder_date >= NOW() - INTERVAL '7 days'
       GROUP BY reminder_date ORDER BY reminder_date DESC`,
      [req.user.user_id]
    );

    // Active medication count
    const medCount = await pool.query(
      'SELECT COUNT(*) FROM medications WHERE user_id = $1 AND is_active = TRUE',
      [req.user.user_id]
    );

    res.status(200).json({
      success: true,
      data: {
        today: {
          date: today,
          total, taken, missed, pending,
          adherence_pct: total > 0 ? Math.round((taken / total) * 100) : 0,
          reminders: rows,
        },
        week_stats: weekStats.rows,
        total_medications: parseInt(medCount.rows[0].count),
      },
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ success: false, message: 'Could not load dashboard.' });
  }
};

module.exports = {
  linkCaregiver, getMyCaregivers, removeCaregiver,
  getMyPatients, getPatientSchedule, getDashboard,
};
