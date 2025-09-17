const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Department code cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Department code must contain only uppercase letters and numbers']
  },
  description: {
    type: String,
    required: [true, 'Department description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Head of Department is required'],
    validate: {
      validator: async function(value) {
        const user = await mongoose.model('User').findById(value);
        return user && user.role === 'Faculty';
      },
      message: 'Head of Department must be a Faculty member'
    }
  },
  establishedYear: {
    type: Number,
    required: [true, 'Established year is required'],
    min: [1900, 'Established year must be after 1900'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future']
  },
  sections: [{
    type: String,
    enum: ['A', 'B', 'C'],
    required: true
  }],
  maxStudentsPerSection: {
    type: Number,
    default: 65,
    min: [1, 'Maximum students per section must be at least 1'],
    max: [100, 'Maximum students per section cannot exceed 100']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Department email is required'],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Department phone is required'],
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    location: {
      type: String,
      required: [true, 'Department location is required'],
      maxlength: [200, 'Location cannot exceed 200 characters']
    }
  },
  facilities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      min: 1
    }
  }],
  
  // Academic Information
  programs: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 6 // Maximum 6 years
    },
    type: {
      type: String,
      enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate'],
      required: true
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total students
departmentSchema.virtual('totalStudents', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { role: 'Student', status: 'Active' }
});

// Virtual for total faculty
departmentSchema.virtual('totalFaculty', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { role: 'Faculty', status: 'Active' }
});

// Virtual for total staff
departmentSchema.virtual('totalStaff', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { role: 'Staff', status: 'Active' }
});

// Virtual for total subjects
departmentSchema.virtual('totalSubjects', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { status: 'Active' }
});

// Indexes for better performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ status: 1 });
departmentSchema.index({ hod: 1 });

// Pre-save middleware to auto-generate department code
departmentSchema.pre('save', function(next) {
  if (!this.code) {
    // Generate code from department name (first 3-4 letters)
    const words = this.name.split(' ');
    if (words.length > 1) {
      // Multi-word: take first letter of each word
      this.code = words.map(word => word.charAt(0)).join('').toUpperCase();
    } else {
      // Single word: take first 3-4 characters
      this.code = this.name.substring(0, 4).toUpperCase();
    }
  }
  next();
});

// Static method to get department with statistics
departmentSchema.statics.findWithStats = function(id) {
  return this.findById(id)
    .populate('hod', 'name email designation')
    .populate('totalStudents')
    .populate('totalFaculty')
    .populate('totalStaff')
    .populate('totalSubjects');
};

// Static method to get all departments with user counts
departmentSchema.statics.getAllWithCounts = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'department',
        as: 'users'
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: 'department',
        as: 'subjects'
      }
    },
    {
      $addFields: {
        totalStudents: {
          $size: {
            $filter: {
              input: '$users',
              cond: { 
                $and: [
                  { $eq: ['$$this.role', 'Student'] },
                  { $eq: ['$$this.status', 'Active'] }
                ]
              }
            }
          }
        },
        totalFaculty: {
          $size: {
            $filter: {
              input: '$users',
              cond: { 
                $and: [
                  { $eq: ['$$this.role', 'Faculty'] },
                  { $eq: ['$$this.status', 'Active'] }
                ]
              }
            }
          }
        },
        totalStaff: {
          $size: {
            $filter: {
              input: '$users',
              cond: { 
                $and: [
                  { $eq: ['$$this.role', 'Staff'] },
                  { $eq: ['$$this.status', 'Active'] }
                ]
              }
            }
          }
        },
        totalSubjects: {
          $size: {
            $filter: {
              input: '$subjects',
              cond: { $eq: ['$$this.status', 'Active'] }
            }
          }
        }
      }
    },
    {
      $project: {
        users: 0,
        subjects: 0
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'hod',
        foreignField: '_id',
        as: 'hodDetails',
        pipeline: [
          { $project: { name: 1, email: 1, designation: 1 } }
        ]
      }
    },
    {
      $unwind: {
        path: '$hodDetails',
        preserveNullAndEmptyArrays: true
      }
    }
  ]);
};

// Instance method to get section statistics
departmentSchema.methods.getSectionStats = async function() {
  const User = mongoose.model('User');
  const stats = await User.aggregate([
    {
      $match: {
        department: this._id,
        role: 'Student',
        status: 'Active'
      }
    },
    {
      $group: {
        _id: {
          section: '$section',
          batch: '$batch'
        },
        count: { $sum: 1 },
        students: { $push: { name: '$name', studentId: '$studentId' } }
      }
    },
    {
      $group: {
        _id: '$_id.section',
        batches: {
          $push: {
            batch: '$_id.batch',
            count: '$count',
            students: '$students'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Department', departmentSchema);