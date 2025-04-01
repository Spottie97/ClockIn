const Shift = require('../models/Shift');
const User = require('../models/User');

// Start a new shift (clock in)
exports.startShift = async (req, res) => {
  try {
    const { verificationImage, location } = req.body;
    
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
      location
    });
    
    await shift.save();
    
    // Update user's active status
    await User.findByIdAndUpdate(req.user.id, { isActive: true });
    
    res.status(201).json({
      message: 'Shift started successfully',
      shift
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start shift', error: error.message });
  }
};

// End current shift (clock out)
exports.endShift = async (req, res) => {
  try {
    const { verificationImage, location, notes } = req.body;
    
    // Find active shift
    const shift = await Shift.findOne({
      employee: req.user.id,
      endTime: null
    });
    
    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }
    
    // Update shift with end time
    shift.endTime = new Date();
    if (notes) shift.notes = notes;
    if (location) shift.location = location;
    if (verificationImage) shift.verificationImage = verificationImage;
    
    await shift.save();
    
    // Update user's active status
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    
    res.status(200).json({
      message: 'Shift ended successfully',
      shift
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to end shift', error: error.message });
  }
};

// Get current user's shifts
exports.getUserShifts = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build query
    const query = { employee: req.user.id };
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    if (status) query.status = status;
    
    // Get shifts
    const shifts = await Shift.find(query)
      .sort({ startTime: -1 })
      .populate('employee', 'firstName lastName email');
    
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get shifts', error: error.message });
  }
};

// Get all pending shifts (for managers/admins)
exports.getPendingShifts = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Get pending shifts
    const shifts = await Shift.find({ status: 'pending', endTime: { $ne: null } })
      .sort({ startTime: -1 })
      .populate('employee', 'firstName lastName email department');
    
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get pending shifts', error: error.message });
  }
};

// Approve or reject a shift
exports.approveShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Find shift
    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Update shift status
    shift.status = approved ? 'approved' : 'rejected';
    shift.approvedBy = req.user.id;
    shift.approvalDate = new Date();
    
    await shift.save();
    
    res.status(200).json({
      message: `Shift ${approved ? 'approved' : 'rejected'} successfully`,
      shift
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process shift', error: error.message });
  }
};

// Get shift by ID
exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await Shift.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');
    
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
    res.status(500).json({ message: 'Failed to get shift', error: error.message });
  }
};