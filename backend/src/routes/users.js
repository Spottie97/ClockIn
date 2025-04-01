const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Get all users (admin only)
router.get('/', auth, userController.getAllUsers);

// Get all employees (admin/manager)
router.get('/employees', auth, userController.getAllEmployees);

// Get user by ID
router.get('/:id', auth, userController.getUserById);

// Create a new user (admin only)
router.post('/', auth, userController.createUser);

// Update a user (admin only)
router.patch('/:id', auth, userController.updateUser);

// Delete a user (admin only)
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;