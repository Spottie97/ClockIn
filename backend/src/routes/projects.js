const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

// Get all projects (admin/manager)
router.get('/', auth, projectController.getAllProjects);

// Get projects for current user
router.get('/user', auth, projectController.getUserProjects);

// Get project by ID
router.get('/:id', auth, projectController.getProjectById);

// Create a new project (admin/manager)
router.post('/', auth, projectController.createProject);

// Update a project
router.patch('/:id', auth, projectController.updateProject);

// Delete a project (admin only)
router.delete('/:id', auth, projectController.deleteProject);

// Add team members to project
router.post('/:id/team', auth, projectController.addTeamMembers);

// Remove team member from project
router.delete('/:id/team/:memberId', auth, projectController.removeTeamMember);

// Get project time report
router.get('/:id/report', auth, projectController.getProjectTimeReport);

module.exports = router;