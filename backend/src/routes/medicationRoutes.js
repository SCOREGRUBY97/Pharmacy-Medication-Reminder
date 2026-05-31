const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getMedications, getMedicationById,
  addMedication, updateMedication, deleteMedication,
} = require('../controllers/medicationController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const medRules = [
  body('medication_name').trim().notEmpty().withMessage('Medication name is required'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('times').isArray({ min: 1 }).withMessage('At least one reminder time is required'),
  body('start_date').isDate().withMessage('Valid start date is required'),
];

// All routes require authentication
router.use(authenticate);

router.get('/', getMedications);
router.get('/:id', getMedicationById);
router.post('/', medRules, addMedication);
router.put('/:id', medRules, updateMedication);
router.delete('/:id', deleteMedication);

module.exports = router;
