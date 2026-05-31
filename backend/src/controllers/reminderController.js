const { query } = require('../config/db');

const getUserId = (req) =>
  (req.query.patient_id && req.user.role !== 'patient') ? req.query.patient_id : req.user.id;

// GET /api/reminders
const getReminders = async (req, res) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const r = await query(`
      SELECT r.*, m.name AS med_name, m.dosage, m.medication_type,
             m.color, m.instructions, m.category, m.generic_name
      FROM reminders r JOIN medications m ON r.medication_id=m.id
      WHERE r.user_id=$1 AND r.scheduled_date=$2
      ORDER BY r.scheduled_time ASC`, [userId, date]);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch reminders' }); }
};

// PATCH /api/reminders/:id/status
const updateStatus = async (req, res) => {
  const { status, notes, mood, side_effects_reported } = req.body;
  if (!['taken','missed','snoozed','skipped','pending'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    const r = await query(`
      UPDATE reminders SET status=$1,
        taken_at=${status==='taken'?'NOW()':'NULL'},
        snoozed_until=${status==='snoozed'?'NOW()+INTERVAL\'10 minutes\'':'NULL'},
        notes=$2
      WHERE id=$3 AND user_id=$4
      RETURNING *, (SELECT name FROM medications WHERE id=medication_id) AS med_name`,
      [status, notes||null, req.params.id, req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Reminder not found' });

    const rem = r.rows[0];
    if (['taken','missed','skipped'].includes(status)) {
      const now = new Date();
      const scheduled = new Date(`${rem.scheduled_date} ${rem.scheduled_time}`);
      const lateBy = status==='taken' ? Math.max(0, Math.round((now-scheduled)/60000)) : null;
      await query(`INSERT INTO adherence_records(reminder_id,user_id,medication_id,action,late_by_minutes,notes,mood,side_effects_reported)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [rem.id,req.user.id,rem.medication_id,status,lateBy,notes||null,mood||null,side_effects_reported||null]);
    }
    res.json({ message: `Marked as ${status}`, reminder: rem });
  } catch { res.status(500).json({ error: 'Failed to update reminder' }); }
};

// GET /api/reminders/history
const getHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days)||30;
    const r = await query(`
      SELECT scheduled_date AS date,
        COUNT(*) AS total,
        COUNT(*) FILTER(WHERE status='taken') AS taken,
        COUNT(*) FILTER(WHERE status='missed') AS missed,
        COUNT(*) FILTER(WHERE status='pending') AS pending,
        COUNT(*) FILTER(WHERE status='skipped') AS skipped,
        ROUND(COUNT(*) FILTER(WHERE status='taken')*100.0/NULLIF(COUNT(*),0),1) AS adherence_pct
      FROM reminders
      WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-$2::INTEGER
      GROUP BY scheduled_date ORDER BY scheduled_date DESC`, [userId, days]);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch history' }); }
};

// GET /api/reminders/stats
const getStats = async (req, res) => {
  try {
    const userId = getUserId(req);
    const [today, week, month, streak, byMed] = await Promise.all([
      query(`SELECT COUNT(*) FILTER(WHERE status='taken') AS taken,
               COUNT(*) FILTER(WHERE status='missed') AS missed,
               COUNT(*) FILTER(WHERE status='pending') AS pending,
               COUNT(*) AS total
             FROM reminders WHERE user_id=$1 AND scheduled_date=CURRENT_DATE`, [userId]),
      query(`SELECT ROUND(COUNT(*) FILTER(WHERE status='taken')*100.0/NULLIF(COUNT(*),0),1) AS pct
             FROM reminders WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-7`, [userId]),
      query(`SELECT ROUND(COUNT(*) FILTER(WHERE status='taken')*100.0/NULLIF(COUNT(*),0),1) AS pct
             FROM reminders WHERE user_id=$1 AND scheduled_date>=CURRENT_DATE-30`, [userId]),
      query(`SELECT COUNT(DISTINCT scheduled_date) AS days
             FROM reminders WHERE user_id=$1 AND status='taken'
               AND scheduled_date>=CURRENT_DATE-100`, [userId]),
      query(`SELECT m.name, m.dosage,
               COUNT(*) FILTER(WHERE r.status='taken') AS taken,
               COUNT(*) FILTER(WHERE r.status='missed') AS missed,
               ROUND(COUNT(*) FILTER(WHERE r.status='taken')*100.0/NULLIF(COUNT(*),0),1) AS pct
             FROM reminders r JOIN medications m ON r.medication_id=m.id
             WHERE r.user_id=$1 AND r.scheduled_date>=CURRENT_DATE-30
             GROUP BY m.id,m.name,m.dosage ORDER BY pct ASC`, [userId]),
    ]);
    res.json({
      today: today.rows[0],
      week_adherence: week.rows[0]?.pct || 0,
      month_adherence: month.rows[0]?.pct || 0,
      streak_days: streak.rows[0]?.days || 0,
      by_medication: byMed.rows,
    });
  } catch { res.status(500).json({ error: 'Failed to fetch stats' }); }
};

module.exports = { getReminders, updateStatus, getHistory, getStats };
