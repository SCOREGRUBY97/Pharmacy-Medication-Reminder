const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, logout, getMe, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const registerRules = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['patient', 'caregiver', 'admin']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/reset-password', resetPassword);

module.exports = router;
