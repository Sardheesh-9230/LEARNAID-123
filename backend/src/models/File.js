const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    unique: true
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  category: {
    type: String,
    enum: [
      'profile_image', 'document', 'syllabus', 'assignment',
      'announcement', 'resource', 'report', 'other'
    ],
    default: 'other'
  },
  
  // Associated entities
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['User', 'Department', 'Subject', 'Assignment'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  
  // Access control
  isPublic: {
    type: Boolean,
    default: false
  },
  allowedRoles: [{
    type: String,
    enum: ['Student', 'Faculty', 'Staff', 'Admin']
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Metadata
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDownloaded: {
    type: Date
  },
  
  // File status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
fileSchema.index({ category: 1, status: 1 });
fileSchema.index({ tags: 1 });

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  return `/api/files/${this._id}`;
});

// Virtual for human-readable file size
fileSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to check user access
fileSchema.statics.checkAccess = function(fileId, userId, userRole) {
  return this.findById(fileId).then(file => {
    if (!file || file.status !== 'active') {
      return false;
    }
    
    // Check if file is public
    if (file.isPublic) {
      return true;
    }
    
    // Check if user is the uploader
    if (file.uploadedBy.toString() === userId.toString()) {
      return true;
    }
    
    // Check if user role is allowed
    if (file.allowedRoles.includes(userRole)) {
      return true;
    }
    
    // Check if user is specifically allowed
    if (file.allowedUsers.some(allowedUser => allowedUser.toString() === userId.toString())) {
      return true;
    }
    
    return false;
  });
};

// Instance method to increment download count
fileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Static method to cleanup expired files
fileSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiryDate: { $lt: new Date() },
      status: 'active'
    },
    { 
      status: 'archived'
    }
  );
};

module.exports = mongoose.model('File', fileSchema);