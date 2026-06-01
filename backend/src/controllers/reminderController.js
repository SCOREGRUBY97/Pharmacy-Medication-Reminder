const { query } = require('../config/db');

const getReminders = async (req, res) => {
  try {
    const uid  = req.query.patient_id && req.user.role !== 'patient' ? req.query.patient_id : req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const r = await query(
      `SELECT r.*, m.name AS med_name, m.dosage, m.instructions, m.category
       FROM reminders r JOIN medications m ON r.medication_id=m.id
       WHERE r.user_id=$1 AND r.scheduled_date=$2 ORDER BY r.scheduled_time`,
      [uid, date]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['taken','missed','pending','snoozed'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const r = await query(
      `UPDATE reminders SET status=$1, taken_at=${status==='taken'?'NOW()':'NULL'}, notes=$2
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [status, notes||null, req.params.id, req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    if (['taken','missed'].includes(status)) {
      await query(
        `INSERT INTO adherence_records (reminder_id,user_id,medication_id,action) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [r.rows[0].id, req.user.id, r.rows[0].medication_id, status]
      );
    }
    res.json({ message: 'Updated', reminder: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getHistory = async (req, res) => {
  try {
    const uid  = req.query.patient_id && req.user.role !== 'patient' ? req.query.patient_id : req.user.id;
    const days = parseInt(req.query.days) || 30;
    const r = await query(
      `SELECT scheduled_date AS date,
              COUNT(*) AS total,
              COUNT(*) FILTER(WHERE status='taken') AS taken,
              COUNT(*) FILTER(WHERE status='missed') AS missed,
              ROUND(COUNT(*) FILTER(WHERE status='taken')*100.0/NULLIF(COUNT(*),0),1) AS adherence_pct
       FROM reminders WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-$2::INTEGER
       GROUP BY scheduled_date ORDER BY scheduled_date DESC`,
      [uid, days]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getStats = async (req, res) => {
  try {
    const uid = req.query.patient_id && req.user.role !== 'patient' ? req.query.patient_id : req.user.id;
    const [today, week] = await Promise.all([
      query(`SELECT COUNT(*) FILTER(WHERE status='taken') AS taken, COUNT(*) FILTER(WHERE status='missed') AS missed, COUNT(*) FILTER(WHERE status='pending') AS pending, COUNT(*) AS total FROM reminders WHERE user_id=$1 AND scheduled_date=CURRENT_DATE`, [uid]),
      query(`SELECT ROUND(COUNT(*) FILTER(WHERE status='taken')*100.0/NULLIF(COUNT(*),0),1) AS pct FROM reminders WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-7`, [uid]),
    ]);
    res.json({ today: today.rows[0], week_adherence: week.rows[0]?.pct || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getReminders, updateStatus, getHistory, getStats };
