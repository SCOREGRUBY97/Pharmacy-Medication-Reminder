const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// GET all users
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = role ? `WHERE role = $3` : '';
    const params = role
      ? [limit, offset, role]
      : [limit, offset];

    const result = await pool.query(
      `SELECT user_id, full_name, email, phone_number, role, is_active, date_created, last_login
       FROM users ${whereClause}
       ORDER BY date_created DESC LIMIT $1 OFFSET $2`,
      params
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch users.' });
  }
});

// PATCH deactivate user
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_active = FALSE WHERE user_id = $1',
      [req.params.id]
    );
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not deactivate user.' });
  }
});

// GET system stats
router.get('/stats', async (req, res) => {
  try {
    const [users, meds, reminders, taken, missed] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM medications WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM reminders WHERE reminder_date = CURRENT_DATE'),
      pool.query("SELECT COUNT(*) FROM reminders WHERE status = 'taken' AND reminder_date = CURRENT_DATE"),
      pool.query("SELECT COUNT(*) FROM reminders WHERE status = 'missed' AND reminder_date = CURRENT_DATE"),
    ]);
    res.json({
      success: true,
      data: {
        total_users: parseInt(users.rows[0].count),
        total_medications: parseInt(meds.rows[0].count),
        todays_reminders: parseInt(reminders.rows[0].count),
        todays_taken: parseInt(taken.rows[0].count),
        todays_missed: parseInt(missed.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load stats.' });
  }
});

module.exports = router;
