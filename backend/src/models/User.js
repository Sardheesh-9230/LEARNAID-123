const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Role and Department Information
  role: {
    type: String,
    enum: ['Student', 'Faculty', 'Staff', 'Admin'],
    required: [true, 'Role is required'],
    default: 'Student'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  
  // Contact Information
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  
  // Student-specific fields
  section: {
    type: String,
    enum: ['A', 'B', 'C'],
    required: function() {
      return this.role === 'Student';
    }
  },
  batch: {
    type: String,
    required: function() {
      return this.role === 'Student';
    },
    match: [/^20\d{2}$/, 'Batch must be a valid year (e.g., 2024)']
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    required: function() {
      return this.role === 'Student';
    }
  },
  enrolledSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  gpa: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: function() {
      return this.role === 'Student';
    }
  },
  
  // Guardian Information (for students)
  guardianName: {
    type: String,
    required: function() {
      return this.role === 'Student';
    },
    maxlength: [100, 'Guardian name cannot exceed 100 characters']
  },
  guardianPhone: {
    type: String,
    required: function() {
      return this.role === 'Student';
    },
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid guardian phone number']
  },
  
  // Faculty-specific fields
  designation: {
    type: String,
    enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer'],
    required: function() {
      return this.role === 'Faculty';
    }
  },
  qualification: {
    type: String,
    required: function() {
      return this.role === 'Faculty';
    },
    maxlength: [200, 'Qualification cannot exceed 200 characters']
  },
  experience: {
    type: Number,
    min: 0,
    max: 50,
    required: function() {
      return this.role === 'Faculty';
    }
  },
  specialization: {
    type: [String],
    required: function() {
      return this.role === 'Faculty';
    }
  },
  assignedSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Common fields
  profileImage: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Virtual for academic year calculation
userSchema.virtual('academicYear').get(function() {
  if (this.role !== 'Student' || !this.batch) return null;
  
  const currentYear = new Date().getFullYear();
  const batchYear = parseInt(this.batch);
  const yearOfStudy = currentYear - batchYear + 1;
  
  switch (yearOfStudy) {
    case 1: return '1st Year';
    case 2: return '2nd Year';
    case 3: return '3rd Year';
    case 4: return '4th Year';
    default: return `${yearOfStudy}th Year`;
  }
});

// Virtual for full name (if needed)
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ department: 1, section: 1, batch: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate student ID
userSchema.pre('save', function(next) {
  if (this.role === 'Student' && !this.studentId) {
    // Generate student ID: DEPT_YEAR_SECTION_NUMBER
    // Example: CS_2024_A_001
    const deptCode = this.department ? this.department.toString().substring(0, 2).toUpperCase() : 'XX';
    const year = this.batch || new Date().getFullYear();
    const section = this.section || 'A';
    
    // Generate a unique number (in production, you'd want a more robust system)
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.studentId = `${deptCode}_${year}_${section}_${randomNum}`;
  }
  next();
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to get user's subjects
userSchema.methods.getSubjects = function() {
  if (this.role === 'Student') {
    return this.enrolledSubjects;
  } else if (this.role === 'Faculty') {
    return this.assignedSubjects;
  }
  return [];
};

// Static method to find users by department
userSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ department: departmentId, status: 'Active' });
};

// Static method to find students by section
userSchema.statics.findStudentsBySection = function(departmentId, section, batch) {
  return this.find({
    role: 'Student',
    department: departmentId,
    section: section,
    batch: batch,
    status: 'Active'
  });
};

// Static method to get department statistics
userSchema.statics.getDepartmentStats = function(departmentId) {
  return this.aggregate([
    { $match: { department: departmentId, status: 'Active' } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);