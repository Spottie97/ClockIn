const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Generate report based on parameters
router.get('/generate', auth, reportController.generateReport);

// Get employee work summary
router.get('/employee/:id', auth, reportController.getEmployeeSummary);

module.exports = router;