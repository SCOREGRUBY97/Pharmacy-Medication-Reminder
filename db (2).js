const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getTodayReminders, getReminderHistory,
  updateReminderStatus, getAdherenceSummary,
} = require('../controllers/reminderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/today', getTodayReminders);
router.get('/history', getReminderHistory);
router.get('/adherence-summary', getAdherenceSummary);
router.patch('/:id/status', [
  body('status')
    .isIn(['taken', 'missed', 'snoozed', 'skipped'])
    .withMessage('Status must be: taken, missed, snoozed, or skipped'),
], updateReminderStatus);

module.exports = router;
