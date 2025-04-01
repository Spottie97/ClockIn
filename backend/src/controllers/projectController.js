const Project = require('../models/Project');
const User = require('../models/User');
const Shift = require('../models/Shift');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    const projects = await Project.find()
      .populate('manager', 'firstName lastName email')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      message: 'Failed to get projects', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get projects for current user
exports.getUserProjects = async (req, res) => {
  try {
    // Find projects where user is in the team or is the manager
    const projects = await Project.find({
      $or: [
        { team: req.user.id },
        { manager: req.user.id }
      ]
    })
    .populate('manager', 'firstName lastName email')
    .populate('department', 'name')
    .sort({ createdAt: -1 });
    
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ 
      message: 'Failed to get projects', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findById(id)
      .populate('manager', 'firstName lastName email')
      .populate('team', 'firstName lastName email jobTitle')
      .populate('department', 'name')
      .populate('createdBy', 'firstName lastName');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to view this project
    const isTeamMember = project.team.some(member => member._id.toString() === req.user.id);
    const isManager = project.manager && project.manager._id.toString() === req.user.id;
    
    if (req.user.role !== 'admin' && !isTeamMember && !isManager) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    // Get project stats
    const shifts = await Shift.find({ 
      project: id, 
      status: 'approved',
      endTime: { $ne: null }
    });
    
    let totalHours = 0;
    let employeeStats = {};
    
    shifts.forEach(shift => {
      if (shift.durationHours) {
        totalHours += shift.durationHours;
        
        // Track per-employee stats
        const employeeId = shift.employee.toString();
        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = {
            totalHours: 0,
            totalShifts: 0
          };
        }
        
        employeeStats[employeeId].totalHours += shift.durationHours;
        employeeStats[employeeId].totalShifts++;
      }
    });
    
    // Format response
    const projectData = {
      ...project.toObject(),
      stats: {
        totalHours,
        totalShifts: shifts.length,
        employeeStats
      }
    };
    
    res.status(200).json(projectData);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      message: 'Failed to get project', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to create projects' });
    }
    
    const { 
      name, description, client, startDate, endDate, 
      status, budget, department, manager, team 
    } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    // Create new project
    const project = new Project({
      name,
      description,
      client,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status || 'planning',
      budget,
      department,
      manager,
      team: team || [],
      createdBy: req.user.id
    });
    
    await project.save();
    
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      message: 'Failed to create project', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to update this project
    const isManager = project.manager && project.manager.toString() === req.user.id;
    
    if (req.user.role !== 'admin' && !isManager) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    const { 
      name, description, client, startDate, endDate, 
      status, budget, department, manager, team 
    } = req.body;
    
    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (client !== undefined) project.client = client;
    if (startDate) project.startDate = new Date(startDate);
    if (endDate) project.endDate = new Date(endDate);
    if (status) project.status = status;
    if (budget !== undefined) project.budget = budget;
    if (department) project.department = department;
    if (manager) project.manager = manager;
    if (team) project.team = team;
    
    await project.save();
    
    res.status(200).json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      message: 'Failed to update project', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete projects' });
    }
    
    // Find project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if there are shifts associated with this project
    const shiftsCount = await Shift.countDocuments({ project: id });
    if (shiftsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete project with associated shifts', 
        shiftsCount 
      });
    }
    
    await Project.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      message: 'Failed to delete project', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Add team members to project
exports.addTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Members array is required' });
    }
    
    // Find project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to update this project
    const isManager = project.manager && project.manager.toString() === req.user.id;
    
    if (req.user.role !== 'admin' && !isManager) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    // Validate that all members exist
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(400).json({ message: 'One or more users not found' });
    }
    
    // Add members to team (avoiding duplicates)
    const currentTeam = project.team.map(member => member.toString());
    members.forEach(member => {
      if (!currentTeam.includes(member)) {
        project.team.push(member);
      }
    });
    
    await project.save();
    
    res.status(200).json({
      message: 'Team members added successfully',
      project
    });
  } catch (error) {
    console.error('Error adding team members:', error);
    res.status(500).json({ 
      message: 'Failed to add team members', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Remove team member from project
exports.removeTeamMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    
    // Find project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to update this project
    const isManager = project.manager && project.manager.toString() === req.user.id;
    
    if (req.user.role !== 'admin' && !isManager) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    // Remove member from team
    project.team = project.team.filter(member => member.toString() !== memberId);
    
    await project.save();
    
    res.status(200).json({
      message: 'Team member removed successfully',
      project
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ 
      message: 'Failed to remove team member', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get project time report
exports.getProjectTimeReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Find project
    const project = await Project.findById(id)
      .populate('manager', 'firstName lastName email')
      .populate('department', 'name');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to view this project
    const isTeamMember = project.team.some(member => member.toString() === req.user.id);
    const isManager = project.manager && project.manager._id.toString() === req.user.id;
    
    if (req.user.role !== 'admin' && !isTeamMember && !isManager) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    // Build query
    const query = { project: id, status: 'approved', endTime: { $ne: null } };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    // Get shifts
    const shifts = await Shift.find(query)
      .populate('employee', 'firstName lastName email jobTitle')
      .sort({ startTime: 1 });
    
    // Calculate statistics
    let totalHours = 0;
    const employeeStats = {};
    const dailyStats = {};
    
    shifts.forEach(shift => {
      if (shift.durationHours) {
        totalHours += shift.durationHours;
        
        // Track per-employee stats
        const employeeId = shift.employee._id.toString();
        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = {
            name: `${shift.employee.firstName} ${shift.employee.lastName}`,
            email: shift.employee.email,
            jobTitle: shift.employee.jobTitle,
            totalHours: 0,
            totalShifts: 0
          };
        }
        
        employeeStats[employeeId].totalHours += shift.durationHours;
        employeeStats[employeeId].totalShifts++;
        
        // Track daily stats
        const dateKey = shift.startTime.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            totalHours: 0,
            totalShifts: 0
          };
        }
        
        dailyStats[dateKey].totalHours += shift.durationHours;
        dailyStats[dateKey].totalShifts++;
      }
    });
    
    // Format response
    const report = {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        client: project.client,
        manager: project.manager,
        department: project.department,
        status: project.status
      },
      dateRange: {
        start: startDate ? new Date(startDate) : null,
        end: endDate ? new Date(endDate) : null
      },
      stats: {
        totalHours,
        totalShifts: shifts.length,
        employeeStats: Object.values(employeeStats),
        dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
      },
      shifts
    };
    
    res.status(200).json(report);
  } catch (error) {
    console.error('Error generating project report:', error);
    res.status(500).json({ 
      message: 'Failed to generate project report', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};