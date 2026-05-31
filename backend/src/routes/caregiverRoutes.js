const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  linkCaregiver, getMyCaregivers, removeCaregiver,
  getMyPatients, getPatientSchedule, getDashboard,
} = require('../controllers/caregiverController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Dashboard
router.get('/dashboard', getDashboard);

// Caregiver management (patients link caregivers)
router.get('/caregiver/my-caregivers', getMyCaregivers);
router.post('/caregiver/link', [
  body('caregiver_name').trim().notEmpty().withMessage('Caregiver name required'),
  body('caregiver_email').isEmail().withMessage('Valid caregiver email required'),
  body('relationship').trim().notEmpty().withMessage('Relationship is required'),
], linkCaregiver);
router.delete('/caregiver/:id', removeCaregiver);

// Caregiver views patients (caregiver role)
router.get('/caregiver/patients', authorize('caregiver', 'admin'), getMyPatients);
router.get('/caregiver/patients/:id/schedule', authorize('caregiver', 'admin'), getPatientSchedule);

module.exports = router;
