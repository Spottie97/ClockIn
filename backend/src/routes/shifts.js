const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const auth = require('../middleware/auth');

// Start a new shift (clock in)
router.post('/', auth, shiftController.startShift);

// End current shift (clock out)
router.patch('/:id', auth, shiftController.endShift);

// Start a break during a shift
router.post('/break/start', auth, shiftController.startBreak);

// End current break
router.post('/break/end', auth, shiftController.endBreak);

// Get current user's shifts
router.get('/employee', auth, shiftController.getUserShifts);

// Get active shift for current user
router.get('/active', auth, shiftController.getActiveShift);

// Get all pending shifts (for managers/admins)
router.get('/pending', auth, shiftController.getPendingShifts);

// Get currently active employees (for managers/admins)
router.get('/active-employees', auth, shiftController.getActiveEmployees);

// Approve or reject a shift
router.patch('/:id/approve', auth, shiftController.approveShift);

// Get shift by ID
router.get('/:id', auth, shiftController.getShiftById);

module.exports = router;