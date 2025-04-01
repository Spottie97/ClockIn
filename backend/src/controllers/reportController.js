const Shift = require('../models/Shift');
const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');

// Generate report based on parameters
exports.generateReport = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    const { type, startDate, endDate, department, employeeId, project, format } = req.query;
    
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
    const query = { ...dateRange, endTime: { $ne: null } };
    
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
    
    // Add project filter if specified
    if (project) {
      query.project = project;
    }
    
    // Get shifts
    const shifts = await Shift.find(query)
      .populate('employee', 'firstName lastName email department jobTitle')
      .populate('project', 'name client')
      .sort({ startTime: 1 });
    
    // Calculate statistics
    const stats = {
      totalShifts: shifts.length,
      totalHours: 0,
      totalBreakHours: 0,
      averageShiftLength: 0,
      overtimeHours: 0,
      overtimeShifts: 0,
      employeeStats: {},
      departmentStats: {},
      projectStats: {},
      dailyStats: {}
    };
    
    // Process shifts
    shifts.forEach(shift => {
      if (shift.endTime) {
        // Calculate shift duration
        const durationHours = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
        stats.totalHours += durationHours;
        
        // Calculate break time
        let breakTimeHours = 0;
        if (shift.breaks && shift.breaks.length > 0) {
          shift.breaks.forEach(breakItem => {
            if (breakItem.endTime) {
              const breakDuration = (new Date(breakItem.endTime) - new Date(breakItem.startTime)) / (1000 * 60 * 60);
              breakTimeHours += breakDuration;
              stats.totalBreakHours += breakDuration;
            }
          });
        }
        
        // Track overtime
        if (shift.overtime) {
          stats.overtimeShifts++;
          // Assuming overtime is anything over 8 hours
          const overtimeHours = Math.max(0, durationHours - 8);
          stats.overtimeHours += overtimeHours;
        }
        
        // Track per-employee stats
        const employeeId = shift.employee._id.toString();
        if (!stats.employeeStats[employeeId]) {
          stats.employeeStats[employeeId] = {
            name: `${shift.employee.firstName} ${shift.employee.lastName}`,
            email: shift.employee.email,
            department: shift.employee.department,
            jobTitle: shift.employee.jobTitle,
            totalShifts: 0,
            totalHours: 0,
            totalBreakHours: 0,
            overtimeHours: 0
          };
        }
        
        stats.employeeStats[employeeId].totalShifts++;
        stats.employeeStats[employeeId].totalHours += durationHours;
        stats.employeeStats[employeeId].totalBreakHours += breakTimeHours;
        
        if (shift.overtime) {
          stats.employeeStats[employeeId].overtimeHours += Math.max(0, durationHours - 8);
        }
        
        // Track per-department stats
        if (shift.employee.department) {
          const department = shift.employee.department;
          if (!stats.departmentStats[department]) {
            stats.departmentStats[department] = {
              name: department,
              totalShifts: 0,
              totalHours: 0,
              totalEmployees: new Set(),
              averageHoursPerEmployee: 0
            };
          }
          
          stats.departmentStats[department].totalShifts++;
          stats.departmentStats[department].totalHours += durationHours;
          stats.departmentStats[department].totalEmployees.add(employeeId);
        }
        
        // Track per-project stats
        if (shift.project) {
          const projectId = shift.project._id.toString();
          if (!stats.projectStats[projectId]) {
            stats.projectStats[projectId] = {
              name: shift.project.name,
              client: shift.project.client,
              totalShifts: 0,
              totalHours: 0,
              totalEmployees: new Set()
            };
          }
          
          stats.projectStats[projectId].totalShifts++;
          stats.projectStats[projectId].totalHours += durationHours;
          stats.projectStats[projectId].totalEmployees.add(employeeId);
        }
        
        // Track daily stats
        const dateKey = shift.startTime.toISOString().split('T')[0];
        if (!stats.dailyStats[dateKey]) {
          stats.dailyStats[dateKey] = {
            date: dateKey,
            totalShifts: 0,
            totalHours: 0,
            totalEmployees: new Set()
          };
        }
        
        stats.dailyStats[dateKey].totalShifts++;
        stats.dailyStats[dateKey].totalHours += durationHours;
        stats.dailyStats[dateKey].totalEmployees.add(employeeId);
      }
    });
    
    // Calculate average shift length
    if (stats.totalShifts > 0) {
      stats.averageShiftLength = stats.totalHours / stats.totalShifts;
    }
    
    // Convert Sets to counts for JSON serialization
    Object.keys(stats.departmentStats).forEach(dept => {
      stats.departmentStats[dept].totalEmployees = stats.departmentStats[dept].totalEmployees.size;
      if (stats.departmentStats[dept].totalEmployees > 0) {
        stats.departmentStats[dept].averageHoursPerEmployee = 
          stats.departmentStats[dept].totalHours / stats.departmentStats[dept].totalEmployees;
      }
    });
    
    Object.keys(stats.projectStats).forEach(proj => {
      stats.projectStats[proj].totalEmployees = stats.projectStats[proj].totalEmployees.size;
    });
    
    Object.keys(stats.dailyStats).forEach(date => {
      stats.dailyStats[date].totalEmployees = stats.dailyStats[date].totalEmployees.size;
    });
    
    // Format response
    const report = {
      reportType: type,
      dateRange: {
        start: new Date(dateRange.startTime.$gte),
        end: new Date(dateRange.startTime.$lte)
      },
      stats: {
        ...stats,
        employeeStats: Object.values(stats.employeeStats),
        departmentStats: Object.values(stats.departmentStats),
        projectStats: Object.values(stats.projectStats),
        dailyStats: Object.values(stats.dailyStats).sort((a, b) => a.date.localeCompare(b.date))
      },
      shifts: format === 'summary' ? undefined : shifts
    };
    
    res.status(200).json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      message: 'Failed to generate report', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get employee work summary
exports.getEmployeeSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, project } = req.query;
    
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
    
    // Build query
    const query = {
      employee: id,
      ...dateRange
    };
    
    // Add project filter if specified
    if (project) {
      query.project = project;
    }
    
    // Get shifts
    const shifts = await Shift.find(query)
      .populate('project', 'name client')
      .sort({ startTime: 1 });
    
    // Calculate statistics
    let totalHours = 0;
    let totalApprovedHours = 0;
    let totalBreakHours = 0;
    let overtimeHours = 0;
    let dailyStats = {};
    let projectStats = {};
    
    shifts.forEach(shift => {
      if (shift.endTime) {
        // Calculate shift duration
        const durationHours = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
        totalHours += durationHours;
        
        // Calculate break time
        let breakTimeHours = 0;
        if (shift.breaks && shift.breaks.length > 0) {
          shift.breaks.forEach(breakItem => {
            if (breakItem.endTime) {
              const breakDuration = (new Date(breakItem.endTime) - new Date(breakItem.startTime)) / (1000 * 60 * 60);
              breakTimeHours += breakDuration;
              totalBreakHours += breakDuration;
            }
          });
        }
        
        if (shift.status === 'approved') {
          totalApprovedHours += durationHours;
        }
        
        // Track overtime
        if (shift.overtime) {
          // Assuming overtime is anything over 8 hours
          const shiftOvertimeHours = Math.max(0, durationHours - 8);
          overtimeHours += shiftOvertimeHours;
        }
        
        // Track daily stats
        const dateKey = shift.startTime.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            totalHours: 0,
            totalShifts: 0,
            breakHours: 0
          };
        }
        
        dailyStats[dateKey].totalHours += durationHours;
        dailyStats[dateKey].totalShifts++;
        dailyStats[dateKey].breakHours += breakTimeHours;
        
        // Track project stats
        if (shift.project) {
          const projectId = shift.project._id.toString();
          if (!projectStats[projectId]) {
            projectStats[projectId] = {
              id: projectId,
              name: shift.project.name,
              client: shift.project.client,
              totalHours: 0,
              totalShifts: 0
            };
          }
          
          projectStats[projectId].totalHours += durationHours;
          projectStats[projectId].totalShifts++;
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
        totalBreakHours,
        totalApprovedHours,
        overtimeHours,
        netWorkHours: totalHours - totalBreakHours,
        pendingShifts: shifts.filter(s => s.status === 'pending').length,
        approvedShifts: shifts.filter(s => s.status === 'approved').length,
        rejectedShifts: shifts.filter(s => s.status === 'rejected').length,
        dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
        projectStats: Object.values(projectStats).sort((a, b) => b.totalHours - a.totalHours)
      },
      shifts
    };
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting employee summary:', error);
    res.status(500).json({ 
      message: 'Failed to get employee summary', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get department summary
exports.getDepartmentSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    
    // Get department
    const department = await Department.findById(id);
    if (!department) {
      // Try to find by name if not found by ID
      const departmentByName = await Department.findOne({ name: id });
      if (!departmentByName) {
        return res.status(404).json({ message: 'Department not found' });
      }
      department = departmentByName;
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
    
    // Get all users in the department
    const departmentUsers = await User.find({ department: department.name }).select('_id firstName lastName email jobTitle');
    const userIds = departmentUsers.map(user => user._id);
    
    // Get shifts
    const shifts = await Shift.find({
      employee: { $in: userIds },
      ...dateRange
    })
      .populate('employee', 'firstName lastName email jobTitle')
      .populate('project', 'name client')
      .sort({ startTime: 1 });
    
    // Calculate statistics
    let totalHours = 0;
    let totalApprovedHours = 0;
    let totalBreakHours = 0;
    let overtimeHours = 0;
    let employeeStats = {};
    let projectStats = {};
    let dailyStats = {};
    
    shifts.forEach(shift => {
      if (shift.endTime) {
        // Calculate shift duration
        const durationHours = (new Date(shift.endTime) - new Date(shift.startTime)) / (1000 * 60 * 60);
        totalHours += durationHours;
        
        // Calculate break time
        let breakTimeHours = 0;
        if (shift.breaks && shift.breaks.length > 0) {
          shift.breaks.forEach(breakItem => {
            if (breakItem.endTime) {
              const breakDuration = (new Date(breakItem.endTime) - new Date(breakItem.startTime)) / (1000 * 60 * 60);
              breakTimeHours += breakDuration;
              totalBreakHours += breakDuration;
            }
          });
        }
        
        if (shift.status === 'approved') {
          totalApprovedHours += durationHours;
        }
        
        // Track overtime
        if (shift.overtime) {
          const shiftOvertimeHours = Math.max(0, durationHours - 8);
          overtimeHours += shiftOvertimeHours;
        }
        
        // Track per-employee stats
        const employeeId = shift.employee._id.toString();
        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = {
            id: employeeId,
            name: `${shift.employee.firstName} ${shift.employee.lastName}`,
            email: shift.employee.email,
            jobTitle: shift.employee.jobTitle,
            totalHours: 0,
            totalShifts: 0,
            breakHours: 0,
            overtimeHours: 0
          };
        }
        
        employeeStats[employeeId].totalHours += durationHours;
        employeeStats[employeeId].totalShifts++;
        employeeStats[employeeId].breakHours += breakTimeHours;
        
        if (shift.overtime) {
          employeeStats[employeeId].overtimeHours += Math.max(0, durationHours - 8);
        }
        
        // Track project stats
        if (shift.project) {
          const projectId = shift.project._id.toString();
          if (!projectStats[projectId]) {
            projectStats[projectId] = {
              id: projectId,
              name: shift.project.name,
              client: shift.project.client,
              totalHours: 0,
              totalShifts: 0,
              employees: new Set()
            };
          }
          
          projectStats[projectId].totalHours += durationHours;
          projectStats[projectId].totalShifts++;
          projectStats[projectId].employees.add(employeeId);
        }
        
        // Track daily stats
        const dateKey = shift.startTime.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            totalHours: 0,
            totalShifts: 0,
            employees: new Set()
          };
        }
        
        dailyStats[dateKey].totalHours += durationHours;
        dailyStats[dateKey].totalShifts++;
        dailyStats[dateKey].employees.add(employeeId);
      }
    });
    
    // Convert Sets to counts for JSON serialization
    Object.keys(projectStats).forEach(proj => {
      projectStats[proj].employeeCount = projectStats[proj].employees.size;
      delete projectStats[proj].employees;
    });
    
    Object.keys(dailyStats).forEach(date => {
      dailyStats[date].employeeCount = dailyStats[date].employees.size;
      delete dailyStats[date].employees;
    });
    
    // Format response
    const summary = {
      department,
      dateRange: {
        start: dateRange.startTime.$gte,
        end: dateRange.startTime.$lte
      },
      stats: {
        totalEmployees: departmentUsers.length,
        activeEmployees: Object.keys(employeeStats).length,
        totalShifts: shifts.length,
        totalHours,
        totalBreakHours,
        totalApprovedHours,
        overtimeHours,
        netWorkHours: totalHours - totalBreakHours,
        averageHoursPerEmployee: departmentUsers.length > 0 ? totalHours / departmentUsers.length : 0,
        pendingShifts: shifts.filter(s => s.status === 'pending').length,
        approvedShifts: shifts.filter(s => s.status === 'approved').length,
        rejectedShifts: shifts.filter(s => s.status === 'rejected').length,
        employeeStats: Object.values(employeeStats).sort((a, b) => b.totalHours - a.totalHours),
        projectStats: Object.values(projectStats).sort((a, b) => b.totalHours - a.totalHours),
        dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
      },
      employees: departmentUsers,
      shifts: shifts.length > 100 ? undefined : shifts // Only include shifts if not too many
    };
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting department summary:', error);
    res.status(500).json({ 
      message: 'Failed to get department summary', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};