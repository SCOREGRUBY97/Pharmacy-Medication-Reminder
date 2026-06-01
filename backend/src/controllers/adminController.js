const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

const getStats = async (req, res) => {
  try {
    const [users, meds, rems] = await Promise.all([
      query('SELECT role, COUNT(*) FROM users WHERE is_active=true GROUP BY role'),
      query('SELECT COUNT(*) FROM medications WHERE is_active=true'),
      query(`SELECT status, COUNT(*) FROM reminders WHERE scheduled_date=CURRENT_DATE GROUP BY status`),
    ]);
    res.json({ users: users.rows, total_medications: meds.rows[0].count, today_reminders: rems.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let sql = `SELECT id,full_name,email,phone,role,is_active,created_at,last_login,
                      (SELECT COUNT(*) FROM medications WHERE user_id=users.id AND is_active=true) AS med_count
               FROM users WHERE 1=1`;
    const params = [];
    if (role)   { params.push(role);         sql += ` AND role=$${params.length}`; }
    if (search) { params.push(`%${search}%`); sql += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`; }
    sql += ' ORDER BY created_at DESC';
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateUser = async (req, res) => {
  try {
    const { full_name, email, role, is_active } = req.body;
    const r = await query(
      'UPDATE users SET full_name=$1,email=$2,role=$3,is_active=$4 WHERE id=$5 RETURNING id,full_name,email,role,is_active',
      [full_name, email, role, is_active, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated', user: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deactivateUser = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot deactivate yourself' });
    await query('UPDATE users SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllMedications = async (req, res) => {
  try {
    const r = await query(`SELECT m.*,u.full_name AS patient_name,u.email AS patient_email FROM medications m JOIN users u ON m.user_id=u.id WHERE m.is_active=true ORDER BY m.created_at DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAdherenceReport = async (req, res) => {
  try {
    const r = await query(`
      SELECT u.full_name,u.email,u.last_login,
             COUNT(r.id) AS total_doses,
             COUNT(r.id) FILTER(WHERE r.status='taken') AS taken,
             COUNT(r.id) FILTER(WHERE r.status='missed') AS missed,
             ROUND(COUNT(r.id) FILTER(WHERE r.status='taken')*100.0/NULLIF(COUNT(r.id),0),1) AS adherence_pct
      FROM users u LEFT JOIN reminders r ON r.user_id=u.id AND r.scheduled_date>=CURRENT_DATE-30
      WHERE u.role='patient' AND u.is_active=true GROUP BY u.id ORDER BY adherence_pct ASC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getStats, getAllUsers, updateUser, deactivateUser, getAllMedications, getAdherenceReport };
