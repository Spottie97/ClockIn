const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  client: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
    default: 'planning'
  },
  budget: {
    type: Number
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for calculating total hours spent on project
projectSchema.virtual('totalHours').get(async function() {
  try {
    const Shift = mongoose.model('Shift');
    const shifts = await Shift.find({ project: this._id, status: 'approved' });
    
    let totalHours = 0;
    shifts.forEach(shift => {
      if (shift.durationHours) {
        totalHours += shift.durationHours;
      }
    });
    
    return totalHours;
  } catch (error) {
    console.error('Error calculating project hours:', error);
    return 0;
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;