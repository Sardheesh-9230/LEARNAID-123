const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
      'ENROLL', 'UNENROLL', 'ASSIGN', 'UNASSIGN',
      'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD'
    ]
  },
  resourceType: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: [
      'User', 'Department', 'Subject', 'Assignment', 'Grade',
      'Attendance', 'Announcement', 'File', 'Report'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String,
    validate: {
      validator: function(v) {
        // IPv4 pattern
        const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        // IPv6 pattern (simplified - covers most common cases including ::1)
        const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        // Check if it matches either IPv4 or IPv6
        return !v || ipv4Pattern.test(v) || ipv6Pattern.test(v) || v === 'localhost';
      },
      message: 'Please enter a valid IP address'
    }
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We're using custom timestamp
});

// Index for better performance
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = function(data) {
  return this.create(data);
};

// Static method to get recent activities
activityLogSchema.statics.getRecentActivities = function(limit = 50) {
  return this.find()
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get user activities
activityLogSchema.statics.getUserActivities = function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);