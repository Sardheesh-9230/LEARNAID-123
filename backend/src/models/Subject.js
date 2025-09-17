const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [200, 'Subject name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    uppercase: true,
    trim: true,
    maxlength: [20, 'Subject code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Subject code must contain only uppercase letters and numbers']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  year: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  
  // Faculty Information
  faculty: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isExternal: {
      type: Boolean,
      default: false
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Student Information
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxStudents: {
    type: Number,
    default: 65,
    min: [1, 'Maximum students must be at least 1'],
    max: [100, 'Maximum students cannot exceed 100']
  },
  
  // Academic Information
  prerequisite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  syllabus: {
    type: String,
    maxlength: [5000, 'Syllabus cannot exceed 5000 characters']
  },
  learningOutcomes: [{
    type: String,
    maxlength: [500, 'Learning outcome cannot exceed 500 characters']
  }],
  
  // Schedule Information
  schedule: {
    lecturesPerWeek: {
      type: Number,
      min: [1, 'Lectures per week must be at least 1'],
      max: [10, 'Lectures per week cannot exceed 10'],
      default: 3
    },
    duration: {
      type: Number, // Duration in minutes
      min: [30, 'Duration must be at least 30 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
      default: 60
    },
    timeSlots: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
      },
      room: {
        type: String,
        maxlength: [50, 'Room cannot exceed 50 characters']
      }
    }]
  },
  
  // Assessment Information
  assessmentStructure: {
    internals: {
      type: Number,
      min: [0, 'Internal marks cannot be negative'],
      max: [100, 'Internal marks cannot exceed 100'],
      default: 40
    },
    externals: {
      type: Number,
      min: [0, 'External marks cannot be negative'],
      max: [100, 'External marks cannot exceed 100'],
      default: 60
    },
    practicals: {
      type: Number,
      min: [0, 'Practical marks cannot be negative'],
      max: [100, 'Practical marks cannot exceed 100'],
      default: 0
    }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active'
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  },
  
  // Resources
  resources: [{
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Resource title cannot exceed 200 characters']
    },
    type: {
      type: String,
      enum: ['Book', 'Paper', 'Website', 'Video', 'Other'],
      required: true
    },
    url: {
      type: String,
      maxlength: [500, 'URL cannot exceed 500 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
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

// Compound index for uniqueness
subjectSchema.index({ code: 1, department: 1, section: 1, academicYear: 1 }, { unique: true });

// Other indexes for performance
subjectSchema.index({ department: 1, year: 1, section: 1 });
subjectSchema.index({ 'faculty.user': 1 });
subjectSchema.index({ status: 1 });
subjectSchema.index({ semester: 1 });

// Virtual for enrollment percentage
subjectSchema.virtual('enrollmentPercentage').get(function() {
  if (this.maxStudents === 0) return 0;
  return Math.round((this.enrolledStudents.length / this.maxStudents) * 100);
});

// Virtual for faculty names
subjectSchema.virtual('facultyNames').get(function() {
  return this.faculty.map(f => f.user.name || f.user).join(', ');
});

// Virtual for is full
subjectSchema.virtual('isFull').get(function() {
  return this.enrolledStudents.length >= this.maxStudents;
});

// Virtual for available slots
subjectSchema.virtual('availableSlots').get(function() {
  return this.maxStudents - this.enrolledStudents.length;
});

// Pre-save middleware to validate schedule
subjectSchema.pre('save', function(next) {
  // Validate that end time is after start time for each time slot
  if (this.schedule && this.schedule.timeSlots) {
    for (const slot of this.schedule.timeSlots) {
      const startTime = new Date(`2000-01-01 ${slot.startTime}`);
      const endTime = new Date(`2000-01-01 ${slot.endTime}`);
      
      if (endTime <= startTime) {
        return next(new Error('End time must be after start time'));
      }
    }
  }
  
  // Validate assessment structure totals
  if (this.assessmentStructure) {
    const total = this.assessmentStructure.internals + 
                  this.assessmentStructure.externals + 
                  this.assessmentStructure.practicals;
    
    if (total !== 100) {
      return next(new Error('Assessment structure must total 100%'));
    }
  }
  
  next();
});

// Static method to find subjects by department and year
subjectSchema.statics.findByDepartmentAndYear = function(departmentId, year) {
  return this.find({
    department: departmentId,
    year: year,
    status: 'Active'
  }).populate('faculty.user', 'name email designation department')
    .populate('department', 'name code')
    .populate('enrolledStudents', 'name studentId email');
};

// Static method to find subjects taught by faculty
subjectSchema.statics.findByFaculty = function(facultyId) {
  return this.find({
    'faculty.user': facultyId,
    status: 'Active'
  }).populate('department', 'name code')
    .populate('enrolledStudents', 'name studentId email');
};

// Static method to get subject statistics
subjectSchema.statics.getSubjectStats = function(departmentId) {
  return this.aggregate([
    { $match: { department: departmentId, status: 'Active' } },
    {
      $group: {
        _id: '$year',
        totalSubjects: { $sum: 1 },
        totalEnrolled: { $sum: { $size: '$enrolledStudents' } },
        avgCredits: { $avg: '$credits' },
        subjects: {
          $push: {
            name: '$name',
            code: '$code',
            section: '$section',
            enrolled: { $size: '$enrolledStudents' },
            maxStudents: '$maxStudents'
          }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

// Instance method to enroll student
subjectSchema.methods.enrollStudent = function(studentId) {
  if (this.enrolledStudents.includes(studentId)) {
    throw new Error('Student is already enrolled in this subject');
  }
  
  if (this.enrolledStudents.length >= this.maxStudents) {
    throw new Error('Subject is full');
  }
  
  this.enrolledStudents.push(studentId);
  return this.save();
};

// Instance method to unenroll student
subjectSchema.methods.unenrollStudent = function(studentId) {
  this.enrolledStudents.pull(studentId);
  return this.save();
};

// Instance method to assign faculty
subjectSchema.methods.assignFaculty = function(facultyId, isExternal = false, isPrimary = false) {
  // Check if faculty is already assigned
  const existingAssignment = this.faculty.find(f => f.user.toString() === facultyId.toString());
  if (existingAssignment) {
    throw new Error('Faculty is already assigned to this subject');
  }
  
  // If this is primary faculty, unset other primary assignments
  if (isPrimary) {
    this.faculty.forEach(f => f.isPrimary = false);
  }
  
  this.faculty.push({
    user: facultyId,
    isExternal: isExternal,
    isPrimary: isPrimary,
    assignedDate: new Date()
  });
  
  return this.save();
};

// Instance method to remove faculty
subjectSchema.methods.removeFaculty = function(facultyId) {
  this.faculty.pull({ user: facultyId });
  return this.save();
};

module.exports = mongoose.model('Subject', subjectSchema);