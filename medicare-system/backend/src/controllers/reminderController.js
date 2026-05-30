const pool = require('../config/db');

// ─── GET /api/reminders/today ─────────────────────────────────
const getTodayReminders = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT r.*, m.medication_name, m.dosage, m.instructions
       FROM reminders r
       JOIN medications m ON r.medication_id = m.medication_id
       WHERE r.user_id = $1 AND r.reminder_date = $2
       ORDER BY r.reminder_time ASC`,
      [req.user.user_id, today]
    );
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('getTodayReminders error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch today\'s reminders.' });
  }
};

// ─── GET /api/reminders/history ───────────────────────────────
const getReminderHistory = async (req, res) => {
  const { days = 7, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT r.*, m.medication_name, m.dosage,
              ar.taken_status, ar.taken_time, ar.notes
       FROM reminders r
       JOIN medications m ON r.medication_id = m.medication_id
       LEFT JOIN adherence_records ar ON r.reminder_id = ar.reminder_id
       WHERE r.user_id = $1
         AND r.reminder_date >= NOW() - INTERVAL '${parseInt(days)} days'
       ORDER BY r.reminder_date DESC, r.reminder_time DESC
       LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset]
    );
    res.status(200).json({ success: true, count: result.rows.length, page: parseInt(page), data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch reminder history.' });
  }
};

// ─── PATCH /api/reminders/:id/status ─────────────────────────
const updateReminderStatus = async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['taken', 'missed', 'snoozed', 'skipped'];

  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: `Invalid status. Use: ${validStatuses.join(', ')}` });

  try {
    // Update reminder status
    const reminder = await pool.query(
      `UPDATE reminders SET status = $1 WHERE reminder_id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.user.user_id]
    );

    if (reminder.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Reminder not found.' });

    // Insert adherence record
    await pool.query(
      `INSERT INTO adherence_records (reminder_id, user_id, taken_status, taken_time, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        req.params.id,
        req.user.user_id,
        status === 'taken' ? 'taken' : status === 'missed' ? 'missed' : 'skipped',
        status === 'taken' ? new Date() : null,
        notes || null,
      ]
    );

    // Notify caregiver if dose missed
    if (status === 'missed') {
      await notifyCaregiverMissedDose(req.user.user_id, reminder.rows[0]);
    }

    res.status(200).json({
      success: true,
      message: `Reminder marked as ${status}.`,
      data: reminder.rows[0],
    });
  } catch (err) {
    console.error('updateReminderStatus error:', err);
    res.status(500).json({ success: false, message: 'Could not update reminder status.' });
  }
};

// ─── GET /api/reminders/adherence-summary ────────────────────
const getAdherenceSummary = async (req, res) => {
  const { days = 7 } = req.query;
  try {
    const result = await pool.query(
      `SELECT
         reminder_date::text AS date,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'taken') AS taken,
         COUNT(*) FILTER (WHERE status = 'missed') AS missed,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending
       FROM reminders
       WHERE user_id = $1
         AND reminder_date >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY reminder_date
       ORDER BY reminder_date DESC`,
      [req.user.user_id]
    );

    const summary = result.rows.map(row => ({
      ...row,
      adherence_pct: row.total > 0
        ? Math.round((row.taken / row.total) * 100)
        : 0,
    }));

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch adherence summary.' });
  }
};

// ─── Internal: notify caregiver on missed dose ────────────────
async function notifyCaregiverMissedDose(userId, reminder) {
  try {
    const caregiver = await pool.query(
      `SELECT caregiver_email, caregiver_name
       FROM caregivers WHERE patient_id = $1 AND is_active = TRUE`,
      [userId]
    );
    if (caregiver.rows.length === 0) return;

    // Log notification
    await pool.query(
      `INSERT INTO notifications (reminder_id, user_id, notification_type, title, message, delivery_status)
       VALUES ($1, $2, 'caregiver_alert', $3, $4, 'sent')`,
      [
        reminder.reminder_id,
        userId,
        'Missed Dose Alert',
        `Your patient missed their ${reminder.reminder_time} dose.`,
      ]
    );

    // Email is handled by the notification service (emailService.js)
    const { sendCaregiverAlert } = require('../utils/emailService');
    await sendCaregiverAlert(caregiver.rows[0], reminder);
  } catch (err) {
    console.error('Caregiver notification error:', err);
  }
}

module.exports = {
  getTodayReminders, getReminderHistory,
  updateReminderStatus, getAdherenceSummary,
};
