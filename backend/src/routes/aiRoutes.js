// ============================================================
// AI Routes - Protected OpenAI medication assistant endpoint
// ============================================================
const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { getMedicationAdvice } = require('../controllers/aiController');

const router = express.Router();

router.post('/advice', protect, [
  body('question').trim().isLength({ min: 5 }).withMessage('Question must be at least 5 characters')
], getMedicationAdvice);

module.exports = router;
