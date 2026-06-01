const jwt  = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'medicare_secret_2026');
    const r = await query('SELECT id,full_name,email,role,is_active FROM users WHERE id=$1', [decoded.id]);
    if (!r.rows.length || !r.rows[0].is_active) return res.status(401).json({ error: 'User not found' });
    req.user = r.rows[0];
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};

module.exports = { authenticate, requireRole };
