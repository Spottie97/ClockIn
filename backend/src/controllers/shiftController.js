const Shift = require('../models/Shift');
const User = require('../models/User');

// Start a new shift (clock in)
exports.startShift = async (req, res) => {
  try {
    const { verificationImage, location, project, device, ipAddress } = req.body;
    
    // Check if user already has an active shift
    const activeShift = await Shift.findOne({
      employee: req.user.id,
      endTime: null
    });
    
    if (activeShift) {
      return res.status(400).json({ message: 'You already have an active shift' });
    }
    
    // Create new shift
    const shift = new Shift({
      employee: req.user.id,
      startTime: new Date(),
      verificationImage,
      location: location ? {
        startLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address
        }
      } : undefined,
      project,
      device,
      ipAddress
    });
    
    await shift.save();
    
    // Update user's active status
    await User.findByIdAndUpdate(req.user.id, { isActive: true });
    
    res.status(201).json({
      message: 'Shift started successfully',
      shift
    });
  } catch (error) {
    console.error('Error starting shift:', error);
    res.status(500).json({ 
      message: 'Failed to start shift', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// End current shift (clock out)
exports.endShift = async (req, res) => {
  try {
    const { verificationImage, location, notes, device, ipAddress } = req.body;
    
    // Find active shift
    const shift = await Shift.findOne({
      employee: req.user.id,
      endTime: null
    });
    
    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }
    
    // Check if there's an active break
    const hasActiveBreak = shift.breaks && shift.breaks.some(breakItem => !breakItem.endTime);
    if (hasActiveBreak) {
      return res.status(400).json({ message: 'You have an active break. Please end your break before ending your shift.' });
    }
    
    // Update shift with end time
    shift.endTime = new Date();
    if (notes) shift.notes = notes;
    if (device) shift.device = device;
    if (ipAddress) shift.ipAddress = ipAddress;
    
    // Update end location
    if (location) {
      if (!shift.location) {
        shift.location = {};
      }
      
      shift.location.endLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address
      };
    }
    
    if (verificationImage) shift.verificationImage = verificationImage;
    
    // Check if shift is overtime (e.g., more than 8 hours)
    const shiftDurationHours = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
    if (shiftDurationHours > 8) {
      shift.overtime = true;
    }
    
    await shift.save();
    
    // Update user's active status
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    
    res.status(200).json({
      message: 'Shift ended successfully',
      shift
    });
  } catch (error) {
    console.error('Error ending shift:', error);
    res.status(500).json({ 
      message: 'Failed to end shift', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Start a break during a shift
exports.startBreak = async (req, res) => {
  try {
    const { type, notes } = req.body;
    
    // Find active shift
    const shift = await Shift.findOne({
      employee: req.user.id,
      endTime: null
    });
    
    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }
    
    // Check if there's already an active break
    const hasActiveBreak = shift.breaks && shift.breaks.some(breakItem => !breakItem.endTime);
    if (hasActiveBreak) {
      return res.status(400).json({ message: 'You already have an active break' });
    }
    
    // Create new break
    const newBreak = {
      startTime: new Date(),
      type: type || 'rest',
      notes
    };
    
    // Add break to shift
    if (!shift.breaks) {
      shift.breaks = [];
    }
    shift.breaks.push(newBreak);
    
    await shift.save();
    
    res.status(200).json({
      message: 'Break started successfully',
      shift
    });
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ 
      message: 'Failed to start break', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// End current break
exports.endBreak = async (req, res) => {
  try {
    // Find active shift
    const shift = await Shift.findOne({
      employee: req.user.id,
      endTime: null
    });
    
    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }
    
    // Find active break
    if (!shift.breaks || shift.breaks.length === 0) {
      return res.status(404).json({ message: 'No active break found' });
    }
    
    let activeBreakIndex = -1;
    for (let i = 0; i < shift.breaks.length; i++) {
      if (!shift.breaks[i].endTime) {
        activeBreakIndex = i;
        break;
      }
    }
    
    if (activeBreakIndex === -1) {
      return res.status(404).json({ message: 'No active break found' });
    }
    
    // End break
    const endTime = new Date();
    shift.breaks[activeBreakIndex].endTime = endTime;
    
    // Calculate duration in minutes
    const startTime = new Date(shift.breaks[activeBreakIndex].startTime);
    const durationMs = endTime - startTime;
    shift.breaks[activeBreakIndex].duration = Math.floor(durationMs / (1000 * 60));
    
    await shift.save();
    
    res.status(200).json({
      message: 'Break ended successfully',
      shift
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ 
      message: 'Failed to end break', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get current user's shifts
exports.getUserShifts = async (req, res) => {
  try {
    const { startDate, endDate, status, project } = req.query;
    
    // Build query
    const query = { employee: req.user.id };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    if (status) query.status = status;
    if (project) query.project = project;
    
    // Get shifts
    const shifts = await Shift.find(query)
      .sort({ startTime: -1 })
      .populate('employee', 'firstName lastName email')
      .populate('project', 'name client');
    
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error getting user shifts:', error);
    res.status(500).json({ 
      message: 'Failed to get shifts', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all pending shifts (for managers/admins)
exports.getPendingShifts = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    const { department } = req.query;
    
    // Build query
    const query = { status: 'pending', endTime: { $ne: null } };
    
    // If department is specified and user is manager, filter by department
    if (department && req.user.role === 'manager') {
      // Get all users in the department
      const departmentUsers = await User.find({ department }).select('_id');
      const userIds = departmentUsers.map(user => user._id);
      
      query.employee = { $in: userIds };
    }
    
    // Get pending shifts
    const shifts = await Shift.find(query)
      .sort({ startTime: -1 })
      .populate('employee', 'firstName lastName email department jobTitle')
      .populate('project', 'name client');
    
    res.status(200).json(shifts);
  } catch (error) {
    console.error('Error getting pending shifts:', error);
    res.status(500).json({ 
      message: 'Failed to get pending shifts', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Approve or reject a shift
exports.approveShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;
    
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Find shift
    const shift = await Shift.findById(id).populate('employee', 'department');
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // If user is a manager, check if they manage the employee's department
    if (req.user.role === 'manager' && shift.employee.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to approve shifts for this department' });
    }
    
    // Update shift status
    shift.status = approved ? 'approved' : 'rejected';
    shift.approvedBy = req.user.id;
    shift.approvalDate = new Date();
    
    if (!approved && rejectionReason) {
      shift.rejectionReason = rejectionReason;
    }
    
    await shift.save();
    
    res.status(200).json({
      message: `Shift ${approved ? 'approved' : 'rejected'} successfully`,
      shift
    });
  } catch (error) {
    console.error('Error processing shift:', error);
    res.status(500).json({ 
      message: 'Failed to process shift', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get shift by ID
exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findById(id)
      .populate('employee', 'firstName lastName email department jobTitle')
      .populate('approvedBy', 'firstName lastName email')
      .populate('project', 'name client');
    
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Check if user is authorized to view this shift
    if (
      shift.employee._id.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    res.status(200).json(shift);
  } catch (error) {
    console.error('Error getting shift:', error);
    res.status(500).json({ 
      message: 'Failed to get shift', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get active shift for current user
exports.getActiveShift = async (req, res) => {
  try {
    const activeShift = await Shift.findOne({
      employee: req.user.id,
      endTime: null
    }).populate('project', 'name client');
    
    if (!activeShift) {
      return res.status(404).json({ message: 'No active shift found' });
    }
    
    res.status(200).json(activeShift);
  } catch (error) {
    console.error('Error getting active shift:', error);
    res.status(500).json({ 
      message: 'Failed to get active shift', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get currently active employees
exports.getActiveEmployees = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Get active users
    const activeUsers = await User.find({ isActive: true })
      .select('firstName lastName email department jobTitle');
    
    // Get their active shifts
    const activeShifts = await Shift.find({
      employee: { $in: activeUsers.map(user => user._id) },
      endTime: null
    }).populate('project', 'name client');
    
    // Combine data
    const activeEmployees = activeUsers.map(user => {
      const shift = activeShifts.find(shift => shift.employee.toString() === user._id.toString());
      return {
        user,
        shift,
        activeTime: shift ? new Date() - new Date(shift.startTime) : null
      };
    });
    
    res.status(200).json(activeEmployees);
  } catch (error) {
    console.error('Error getting active employees:', error);
    res.status(500).json({ 
      message: 'Failed to get active employees', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};