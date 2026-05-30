const { validationResult } = require('express-validator');
const pool = require('../config/db');

// ─── GET /api/medicines ───────────────────────────────────────
// Get all medications for logged-in user
const getMedications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM medications
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY created_at DESC`,
      [req.user.user_id]
    );
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('getMedications error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch medications.' });
  }
};

// ─── GET /api/medicines/:id ───────────────────────────────────
const getMedicationById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medications WHERE medication_id = $1 AND user_id = $2',
      [req.params.id, req.user.user_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Medication not found.' });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch medication.' });
  }
};

// ─── POST /api/medicines ──────────────────────────────────────
const addMedication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    medication_name, dosage, frequency, times,
    category, instructions, start_date, end_date,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO medications
         (user_id, medication_name, dosage, frequency, times, category, instructions, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.user_id, medication_name, dosage, frequency,
        times, category, instructions, start_date, end_date,
      ]
    );

    // Auto-generate reminder rows for today
    const med = result.rows[0];
    const today = new Date().toISOString().split('T')[0];
    for (const t of times) {
      await pool.query(
        `INSERT INTO reminders (medication_id, user_id, reminder_time, reminder_date)
         VALUES ($1,$2,$3,$4)`,
        [med.medication_id, req.user.user_id, t, today]
      );
    }

    res.status(201).json({ success: true, message: 'Medication added successfully.', data: med });
  } catch (err) {
    console.error('addMedication error:', err);
    res.status(500).json({ success: false, message: 'Could not add medication.' });
  }
};

// ─── PUT /api/medicines/:id ───────────────────────────────────
const updateMedication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    medication_name, dosage, frequency, times,
    category, instructions, start_date, end_date,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE medications
       SET medication_name=$1, dosage=$2, frequency=$3, times=$4,
           category=$5, instructions=$6, start_date=$7, end_date=$8,
           updated_at=NOW()
       WHERE medication_id=$9 AND user_id=$10
       RETURNING *`,
      [
        medication_name, dosage, frequency, times,
        category, instructions, start_date, end_date,
        req.params.id, req.user.user_id,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Medication not found.' });

    res.status(200).json({ success: true, message: 'Medication updated.', data: result.rows[0] });
  } catch (err) {
    console.error('updateMedication error:', err);
    res.status(500).json({ success: false, message: 'Could not update medication.' });
  }
};

// ─── DELETE /api/medicines/:id ────────────────────────────────
const deleteMedication = async (req, res) => {
  try {
    // Soft delete — set is_active = false
    const result = await pool.query(
      `UPDATE medications SET is_active = FALSE
       WHERE medication_id = $1 AND user_id = $2
       RETURNING medication_id`,
      [req.params.id, req.user.user_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Medication not found.' });

    res.status(200).json({ success: true, message: 'Medication deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete medication.' });
  }
};

module.exports = {
  getMedications, getMedicationById,
  addMedication, updateMedication, deleteMedication,
};
