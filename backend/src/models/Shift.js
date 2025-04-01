const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  shiftType: {
    type: String,
    enum: ['regular', 'remote', 'on-call'],
    default: 'regular'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationImage: {
    type: String
  },
  verificationData: {
    facialMatch: {
      type: Boolean,
      default: null
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    verificationMethod: {
      type: String,
      enum: ['photo', 'fingerprint', 'facial', 'pin', 'none'],
      default: 'none'
    },
    verifiedAt: {
      type: Date
    }
  },
  location: {
    startLocation: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      accuracy: {
        type: Number
      },
      address: {
        type: String
      }
    },
    endLocation: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      accuracy: {
        type: Number
      },
      address: {
        type: String
      }
    }
  },
  notes: {
    type: String,
    trim: true
  },
  breaks: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // in minutes
    },
    type: {
      type: String,
      enum: ['lunch', 'rest', 'other'],
      default: 'rest'
    },
    notes: String
  }],
  overtime: {
    type: Boolean,
    default: false
  },
  hourlyRate: {
    type: Number,
    default: null
  },
  payMultiplier: {
    type: Number,
    default: 1.0 // For overtime or special shifts
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String
  },
  device: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
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

// Virtual for shift duration in minutes
shiftSchema.virtual('durationMinutes').get(function() {
  if (!this.endTime) return null;
  
  const start = new Date(this.startTime);
  const end = new Date(this.endTime);
  const diffMs = end - start;
  
  // Calculate total break time in milliseconds
  let breakTimeMs = 0;
  if (this.breaks && this.breaks.length > 0) {
    this.breaks.forEach(breakItem => {
      if (breakItem.endTime) {
        const breakStart = new Date(breakItem.startTime);
        const breakEnd = new Date(breakItem.endTime);
        breakTimeMs += (breakEnd - breakStart);
      }
    });
  }
  
  // Subtract break time from total duration
  return Math.floor((diffMs - breakTimeMs) / (1000 * 60));
});

// Virtual for shift duration in hours (decimal)
shiftSchema.virtual('durationHours').get(function() {
  if (!this.endTime) return null;
  
  const start = new Date(this.startTime);
  const end = new Date(this.endTime);
  const diffMs = end - start;
  
  // Calculate total break time in milliseconds
  let breakTimeMs = 0;
  if (this.breaks && this.breaks.length > 0) {
    this.breaks.forEach(breakItem => {
      if (breakItem.endTime) {
        const breakStart = new Date(breakItem.startTime);
        const breakEnd = new Date(breakItem.endTime);
        breakTimeMs += (breakEnd - breakStart);
      }
    });
  }
  
  // Subtract break time from total duration
  return (diffMs - breakTimeMs) / (1000 * 60 * 60);
});

// Virtual for total break time in minutes
shiftSchema.virtual('breakTimeMinutes').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  
  let totalBreakTimeMs = 0;
  this.breaks.forEach(breakItem => {
    if (breakItem.endTime) {
      const breakStart = new Date(breakItem.startTime);
      const breakEnd = new Date(breakItem.endTime);
      totalBreakTimeMs += (breakEnd - breakStart);
    }
  });
  
  return Math.floor(totalBreakTimeMs / (1000 * 60));
});

// Virtual for calculating pay for this shift
shiftSchema.virtual('calculatedPay').get(function() {
  if (!this.endTime || !this.hourlyRate) return null;
  
  const hours = this.durationHours;
  const rate = this.hourlyRate;
  const multiplier = this.payMultiplier || 1.0;
  
  return parseFloat((hours * rate * multiplier).toFixed(2));
});

// Method to check if a shift is currently active
shiftSchema.methods.isActive = function() {
  return this.startTime && !this.endTime;
};

// Method to check if a shift is eligible for approval
shiftSchema.methods.isEligibleForApproval = function() {
  return this.endTime && this.status === 'pending';
};

// Static method to find all active shifts
shiftSchema.statics.findActiveShifts = function(query = {}) {
  return this.find({
    ...query,
    startTime: { $ne: null },
    endTime: null
  });
};

// Static method to find shifts by date range
shiftSchema.statics.findByDateRange = function(startDate, endDate, query = {}) {
  return this.find({
    ...query,
    startTime: { $gte: startDate, $lte: endDate }
  });
};

// Middleware to update the updatedAt timestamp
shiftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;