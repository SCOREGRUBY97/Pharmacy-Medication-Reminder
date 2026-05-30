const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

// ─── Helper: generate JWT ─────────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── POST /api/auth/register ──────────────────────────────────
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { full_name, email, phone_number, password, role = 'patient' } = req.body;

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone_number, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, email, phone_number, role, date_created`,
      [full_name, email, phone_number, password_hash, role]
    );

    const user = result.rows[0];
    const token = generateToken(user.user_id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

    const token = generateToken(user.user_id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────
const logout = (req, res) => {
  // JWT is stateless — client deletes token.
  // Optionally implement token blacklisting with Redis.
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─── GET /api/auth/me ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, full_name, email, phone_number, role, date_created, last_login FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user.' });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────
const resetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    // Always return success to avoid email enumeration
    if (result.rows.length > 0) {
      // TODO: generate reset token and send email
      console.log(`Password reset requested for: ${email}`);
    }
    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, logout, getMe, resetPassword };
