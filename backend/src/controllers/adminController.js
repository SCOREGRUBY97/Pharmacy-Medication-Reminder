const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [users, meds, rems, adherence, growth, topMeds] = await Promise.all([
      query(`SELECT role, COUNT(*) AS count, COUNT(*) FILTER(WHERE is_active) AS active FROM users GROUP BY role`),
      query(`SELECT COUNT(*) FILTER(WHERE is_active) AS active, COUNT(*) AS total FROM medications`),
      query(`SELECT status, COUNT(*) AS count FROM reminders WHERE scheduled_date=CURRENT_DATE GROUP BY status`),
      query(`SELECT ROUND(COUNT(*) FILTER(WHERE status='taken')*100.0/NULLIF(COUNT(*),0),1) AS week_pct,
               COUNT(*) FILTER(WHERE status='missed') AS week_missed
             FROM reminders WHERE scheduled_date>=CURRENT_DATE-7`),
      query(`SELECT DATE_TRUNC('day',created_at) AS day, COUNT(*) AS signups
             FROM users WHERE created_at>=NOW()-INTERVAL'30 days' GROUP BY 1 ORDER BY 1`),
      query(`SELECT m.name, COUNT(*) AS total, COUNT(*) FILTER(WHERE r.status='missed') AS missed
             FROM reminders r JOIN medications m ON r.medication_id=m.id
             WHERE r.scheduled_date>=CURRENT_DATE-7
             GROUP BY m.name ORDER BY missed DESC LIMIT 5`),
    ]);
    res.json({
      users: users.rows,
      medications: meds.rows[0],
      today_reminders: rems.rows,
      adherence: adherence.rows[0],
      user_growth: growth.rows,
      top_missed_medications: topMeds.rows,
    });
  } catch (err) {
    logger.error('Admin stats error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  const { role, search, active, page=1, limit=20 } = req.query;
  try {
    let sql = `SELECT u.id,u.full_name,u.email,u.phone,u.role,u.is_active,u.is_verified,
                 u.created_at,u.last_login,u.last_seen,
                 COUNT(DISTINCT m.id) FILTER(WHERE m.is_active) AS medication_count,
                 ROUND(COUNT(r.id) FILTER(WHERE r.status='taken')*100.0/NULLIF(COUNT(r.id),0),1) AS adherence_pct
               FROM users u
               LEFT JOIN medications m ON m.user_id=u.id
               LEFT JOIN reminders r ON r.user_id=u.id AND r.scheduled_date>=CURRENT_DATE-30
               WHERE 1=1`;
    const params = [];
    if (role)   { params.push(role);         sql+=` AND u.role=$${params.length}`; }
    if (active) { params.push(active==='true'); sql+=` AND u.is_active=$${params.length}`; }
    if (search) { params.push(`%${search}%`); sql+=` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
    sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page)-1)*parseInt(limit)}`;
    const r = await query(sql, params);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch users' }); }
};

// POST /api/admin/users
const createUser = async (req, res) => {
  const { full_name,email,password,phone,role } = req.body;
  try {
    const existing = await query('SELECT id FROM users WHERE email=$1', [email?.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password||'Temp@1234', 12);
    const r = await query(`INSERT INTO users(full_name,email,password_hash,phone,role,is_verified)
      VALUES($1,$2,$3,$4,$5,true) RETURNING id,full_name,email,role`,
      [full_name,email?.toLowerCase(),hash,phone||null,role||'patient']);
    logger.info(`Admin created user: ${email}`);
    res.status(201).json({ message: 'User created', user: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed to create user' }); }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  const { full_name,email,phone,role,is_active,is_verified } = req.body;
  try {
    const r = await query(`UPDATE users SET full_name=$1,email=$2,phone=$3,role=$4,
      is_active=$5,is_verified=$6,updated_at=NOW()
      WHERE id=$7 RETURNING id,full_name,email,role,is_active`,
      [full_name,email?.toLowerCase(),phone,role,is_active,is_verified,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    await query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id,new_values)
      VALUES($1,'ADMIN_UPDATE_USER','user',$2,$3)`,
      [req.user.id, req.params.id, JSON.stringify(req.body)]);
    res.json({ message: 'User updated', user: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed to update user' }); }
};

// DELETE /api/admin/users/:id
const deactivateUser = async (req, res) => {
  if (parseInt(req.params.id)===req.user.id)
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  try {
    await query('UPDATE users SET is_active=false WHERE id=$1', [req.params.id]);
    await query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id)
      VALUES($1,'ADMIN_DEACTIVATE_USER','user',$2)`, [req.user.id, req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch { res.status(500).json({ error: 'Failed to deactivate user' }); }
};

// GET /api/admin/medications
const getAllMedications = async (req, res) => {
  try {
    const r = await query(`SELECT m.*,u.full_name AS patient_name,u.email AS patient_email
      FROM medications m JOIN users u ON m.user_id=u.id
      WHERE m.is_active=true ORDER BY m.created_at DESC`);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed' }); }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const r = await query(`SELECT al.*,u.full_name,u.email FROM audit_logs al
      LEFT JOIN users u ON al.user_id=u.id ORDER BY al.created_at DESC LIMIT 100`);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed' }); }
};

// GET /api/admin/reports/adherence
const adherenceReport = async (req, res) => {
  try {
    const r = await query(`
      SELECT u.full_name,u.email,u.last_login,
        COUNT(r.id) AS total_doses,
        COUNT(r.id) FILTER(WHERE r.status='taken') AS taken,
        COUNT(r.id) FILTER(WHERE r.status='missed') AS missed,
        ROUND(COUNT(r.id) FILTER(WHERE r.status='taken')*100.0/NULLIF(COUNT(r.id),0),1) AS adherence_pct,
        COUNT(DISTINCT m.id) FILTER(WHERE m.is_active) AS active_meds
      FROM users u
      LEFT JOIN reminders r ON r.user_id=u.id AND r.scheduled_date>=CURRENT_DATE-30
      LEFT JOIN medications m ON m.user_id=u.id
      WHERE u.role='patient' AND u.is_active=true
      GROUP BY u.id ORDER BY adherence_pct ASC NULLS LAST`);
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Failed' }); }
};

module.exports = { getStats, getAllUsers, createUser, updateUser, deactivateUser, getAllMedications, getAuditLogs, adherenceReport };
