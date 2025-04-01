const Shift = require('../models/Shift');
const User = require('../models/User');

// Generate report based on parameters
exports.generateReport = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    const { type, startDate, endDate, department, employeeId } = req.query;
    
    // Build date range
    let dateRange = {};
    
    if (type === 'daily') {
      // Single day (today if not specified)
      const reportDate = startDate ? new Date(startDate) : new Date();
      const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));
      
      dateRange = {
        startTime: { $gte: startOfDay, $lte: endOfDay }
      };
    } else if (type === 'weekly') {
      // Current week if not specified
      const reportDate = startDate ? new Date(startDate) : new Date();
      const day = reportDate.getDay();
      const diff = reportDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      
      const startOfWeek = new Date(reportDate.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      dateRange = {
        startTime: { $gte: startOfWeek, $lte: endOfWeek }
      };
    } else if (type === 'monthly') {
      // Current month if not specified
      const reportDate = startDate ? new Date(startDate) : new Date();
      const startOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
      const endOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      dateRange = {
        startTime: { $gte: startOfMonth, $lte: endOfMonth }
      };
    } else if (type === 'custom' && startDate && endDate) {
      // Custom date range
      const customStart = new Date(startDate);
      customStart.setHours(0, 0, 0, 0);
      
      const customEnd = new Date(endDate);
      customEnd.setHours(23, 59, 59, 999);
      
      dateRange = {
        startTime: { $gte: customStart, $lte: customEnd }
      };
    } else {
      return res.status(400).json({ message: 'Invalid report parameters' });
    }
    
    // Build query
    const query = { ...dateRange };
    
    // Add department filter if specified
    if (department) {
      // Get all users in the department
      const departmentUsers = await User.find({ department }).select('_id');
      const userIds = departmentUsers.map(user => user._id);
      
      query.employee = { $in: userIds };
    }
    
    // Add employee filter if specified
    if (employeeId) {
      query.employee = employeeId;
    }
    
    // Get shifts
    const shifts = await Shift.find(query)
      .populate('employee', 'firstName lastName email department jobTitle')
      .sort({ startTime: 1 });
    
    // Calculate statistics
    const stats = {
      totalShifts: shifts.length,
      totalHours: 0,
      averageShiftLength: 0,
      employeeStats: {}
    };
    
    // Process shifts
    shifts.forEach(shift => {
      if (shift.endTime) {
        const durationHours = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
        stats.totalHours += durationHours;
        
        // Track per-employee stats
        const employeeId = shift.employee._id.toString();
        if (!stats.employeeStats[employeeId]) {
          stats.employeeStats[employeeId] = {
            name: `${shift.employee.firstName} ${shift.employee.lastName}`,
            email: shift.employee.email,
            department: shift.employee.department,
            totalShifts: 0,
            totalHours: 0
          };
        }
        
        stats.employeeStats[employeeId].totalShifts++;
        stats.employeeStats[employeeId].totalHours += durationHours;
      }
    });
    
    // Calculate average shift length
    if (stats.totalShifts > 0) {
      stats.averageShiftLength = stats.totalHours / stats.totalShifts;
    }
    
    // Format response
    const report = {
      reportType: type,
      dateRange: {
        start: new Date(dateRange.startTime.$gte),
        end: new Date(dateRange.startTime.$lte)
      },
      stats,
      shifts
    };
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};

// Get employee work summary
exports.getEmployeeSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if user is admin, manager, or the employee themselves
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.id !== id) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Build date range
    let dateRange = {};
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateRange = {
        startTime: { $gte: start, $lte: end }
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      dateRange = {
        startTime: { $gte: startOfMonth, $lte: endOfMonth }
      };
    }
    
    // Get employee
    const employee = await User.findById(id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get shifts
    const shifts = await Shift.find({
      employee: id,
      ...dateRange
    }).sort({ startTime: 1 });
    
    // Calculate statistics
    let totalHours = 0;
    let totalApprovedHours = 0;
    
    shifts.forEach(shift => {
      if (shift.endTime) {
        const durationHours = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
        totalHours += durationHours;
        
        if (shift.status === 'approved') {
          totalApprovedHours += durationHours;
        }
      }
    });
    
    // Format response
    const summary = {
      employee,
      dateRange: {
        start: dateRange.startTime.$gte,
        end: dateRange.startTime.$lte
      },
      stats: {
        totalShifts: shifts.length,
        totalHours,
        totalApprovedHours,
        pendingShifts: shifts.filter(s => s.status === 'pending').length,
        approvedShifts: shifts.filter(s => s.status === 'approved').length,
        rejectedShifts: shifts.filter(s => s.status === 'rejected').length
      },
      shifts
    };
    
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get employee summary', error: error.message });
  }
};