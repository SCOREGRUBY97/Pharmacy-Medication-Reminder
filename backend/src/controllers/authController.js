const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { sendEmail, welcomeEmail, passwordResetEmail } = require('../utils/emailService');
const { sendPush, pushTypes } = require('../utils/pushService');
const logger = require('../utils/logger');

const generateToken = (user, expiresIn = process.env.JWT_EXPIRES_IN || '7d') =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn });

// POST /api/auth/register
const register = async (req, res) => {
  const { full_name, email, password, phone, role, date_of_birth, gender } = req.body;
  if (!full_name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });

  try {
    const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const validRole = ['patient','caregiver'].includes(role) ? role : 'patient';

    const result = await query(`
      INSERT INTO users(full_name,email,password_hash,phone,role,date_of_birth,gender)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING id,full_name,email,phone,role,created_at`,
      [full_name.trim(), email.toLowerCase().trim(), hash, phone||null, validRole, date_of_birth||null, gender||null]
    );
    const user = result.rows[0];
    const token = generateToken(user);

    // Log audit
    await query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id,new_values)
      VALUES($1,'USER_REGISTERED','user',$1,$2)`, [user.id, JSON.stringify({ role: user.role, email: user.email })]);

    // Send welcome email + push
    sendEmail({ to: user.email, ...welcomeEmail(user.full_name, user.role) }).catch(() => {});

    logger.info(`New user registered: ${user.email} (${user.role})`);
    res.status(201).json({
      message: 'Account created! Check your email for a welcome message.',
      token,
      user: { id:user.id, full_name:user.full_name, email:user.email, role:user.role, phone:user.phone }
    });
  } catch (err) {
    logger.error('Register error', { error: err.message });
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email.toLowerCase().trim()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user);
    await query('UPDATE users SET last_login=NOW(), last_seen=NOW() WHERE id=$1', [user.id]);
    await query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id)
      VALUES($1,'USER_LOGIN','user',$1)`, [user.id]);

    logger.info(`User logged in: ${user.email}`);
    res.json({
      message: 'Welcome back!',
      token,
      user: { id:user.id, full_name:user.full_name, email:user.email, role:user.role, phone:user.phone,
              notify_email:user.notify_email, notify_push:user.notify_push, notify_sms:user.notify_sms }
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const r = await query(`SELECT id,full_name,email,phone,role,date_of_birth,gender,avatar_url,
      notify_email,notify_push,notify_sms,medical_conditions,allergies,
      doctor_name,doctor_phone,emergency_contact_name,emergency_contact_phone,
      created_at,last_login FROM users WHERE id=$1`, [req.user.id]);
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const { full_name,phone,date_of_birth,gender,notify_email,notify_push,notify_sms,
          medical_conditions,allergies,doctor_name,doctor_phone,
          emergency_contact_name,emergency_contact_phone } = req.body;
  try {
    const r = await query(`UPDATE users SET full_name=$1,phone=$2,date_of_birth=$3,gender=$4,
      notify_email=$5,notify_push=$6,notify_sms=$7,medical_conditions=$8,allergies=$9,
      doctor_name=$10,doctor_phone=$11,emergency_contact_name=$12,emergency_contact_phone=$13,updated_at=NOW()
      WHERE id=$14 RETURNING id,full_name,email,phone,role,notify_email,notify_push,notify_sms`,
      [full_name,phone,date_of_birth||null,gender||null,notify_email??true,notify_push??true,notify_sms??false,
       medical_conditions||[],allergies||[],doctor_name||null,doctor_phone||null,
       emergency_contact_name||null,emergency_contact_phone||null,req.user.id]);
    res.json({ message: 'Profile updated', user: r.rows[0] });
  } catch { res.status(500).json({ error: 'Failed to update profile' }); }
};

// PUT /api/auth/password
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const r = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!await bcrypt.compare(current_password, r.rows[0].password_hash))
      return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    await query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id)
      VALUES($1,'PASSWORD_CHANGED','user',$1)`, [req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch { res.status(500).json({ error: 'Failed to change password' }); }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const r = await query('SELECT id,full_name FROM users WHERE email=$1 AND is_active=true', [email?.toLowerCase()]);
    // Always return 200 to prevent email enumeration
    res.json({ message: 'If that email exists, a reset link has been sent.' });
    if (!r.rows.length) return;
    const user = r.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const hash  = crypto.createHash('sha256').update(token).digest('hex');
    await query('INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL\'1 hour\')', [user.id, hash]);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    sendEmail({ to: email, ...passwordResetEmail(user.full_name, resetUrl) }).catch(() => {});
  } catch { res.status(500).json({ error: 'Server error' }); }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Token and password required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const r = await query('SELECT * FROM password_reset_tokens WHERE token_hash=$1 AND expires_at>NOW() AND used=false', [hash]);
    if (!r.rows.length) return res.status(400).json({ error: 'Invalid or expired reset token' });
    const pwHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [pwHash, r.rows[0].user_id]);
    await query('UPDATE password_reset_tokens SET used=true WHERE id=$1', [r.rows[0].id]);
    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch { res.status(500).json({ error: 'Failed to reset password' }); }
};

// POST /api/auth/push-subscribe
const savePushSubscription = async (req, res) => {
  try {
    await query('UPDATE users SET push_subscription=$1 WHERE id=$2', [JSON.stringify(req.body.subscription), req.user.id]);
    sendPush(req.user.id, pushTypes.welcome(req.user.full_name)).catch(() => {});
    res.json({ message: 'Push notifications enabled!' });
  } catch { res.status(500).json({ error: 'Failed to save subscription' }); }
};

// DELETE /api/auth/push-subscribe
const removePushSubscription = async (req, res) => {
  try {
    await query('UPDATE users SET push_subscription=NULL WHERE id=$1', [req.user.id]);
    res.json({ message: 'Push notifications disabled' });
  } catch { res.status(500).json({ error: 'Failed to remove subscription' }); }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword, savePushSubscription, removePushSubscription };
