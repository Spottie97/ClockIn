const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  location: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  notes: {
    type: String,
    trim: true
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
  
  return Math.floor(diffMs / (1000 * 60));
});

// Virtual for shift duration in hours (decimal)
shiftSchema.virtual('durationHours').get(function() {
  if (!this.endTime) return null;
  
  const start = new Date(this.startTime);
  const end = new Date(this.endTime);
  const diffMs = end - start;
  
  return diffMs / (1000 * 60 * 60);
});

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;