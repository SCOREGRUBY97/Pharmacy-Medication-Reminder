const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET || 'medicare_secret_2026',
  { expiresIn: '7d' }
);

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;
    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (existing.rows.length)
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });

    const hash = await bcrypt.hash(password, 10);
    const validRole = ['patient', 'caregiver', 'admin'].includes(role) ? role : 'patient';

    const r = await query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, is_active, is_verified)
       VALUES ($1,$2,$3,$4,$5,true,true) RETURNING id, full_name, email, role`,
      [full_name.trim(), email.toLowerCase().trim(), hash, phone || null, validRole]
    );
    const user = r.rows[0];
    res.status(201).json({ message: 'Account created!', token: sign(user), user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const r = await query(
      'SELECT * FROM users WHERE email=$1 AND is_active=true',
      [email.toLowerCase().trim()]
    );

    if (!r.rows.length)
      return res.status(401).json({ error: 'No account found with this email' });

    const user = r.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Incorrect password' });

    await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    res.json({
      message: 'Welcome back!',
      token: sign(user),
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const r = await query(
      'SELECT id, full_name, email, phone, role, notify_email, notify_push, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, notify_email, notify_push } = req.body;
    const r = await query(
      'UPDATE users SET full_name=$1, phone=$2, notify_email=$3, notify_push=$4 WHERE id=$5 RETURNING id, full_name, email, phone, role',
      [full_name, phone, notify_email ?? true, notify_push ?? true, req.user.id]
    );
    res.json({ message: 'Profile updated', user: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const r = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, r.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Change failed' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => res.json({ message: 'Logged out' });

module.exports = { register, login, getMe, updateProfile, changePassword, logout };
