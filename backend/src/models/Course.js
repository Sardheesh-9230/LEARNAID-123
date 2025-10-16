const mongoose = require('mongoose');

/**
 * Course Model
 * Represents a course with chapters, managed by faculty
 */
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    uppercase: true,
    trim: true,
    unique: true,
    maxlength: [20, 'Course code cannot exceed 20 characters'],
    match: [/^[A-Z0-9\-]+$/, 'Course code must contain only uppercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  overview: {
    type: String,
    maxlength: [5000, 'Overview cannot exceed 5000 characters']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
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
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  },
  
  // Faculty Information
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  
  // Learning Objectives
  learningObjectives: [{
    type: String,
    maxlength: [500, 'Learning objective cannot exceed 500 characters']
  }],
  
  // Course Status
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Completed', 'Archived'],
    default: 'Draft'
  },
  
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

// Virtual for chapters
courseSchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Indexes
courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ department: 1, subject: 1 });
courseSchema.index({ faculty: 1 });
courseSchema.index({ year: 1, section: 1, semester: 1 });
courseSchema.index({ status: 1 });

// Methods
courseSchema.methods.toJSON = function() {
  const course = this.toObject();
  course.id = course._id.toString();
  return course;
};

// Static method to get courses by faculty
courseSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ faculty: facultyId })
    .populate('department', 'name code')
    .populate('subject', 'name code')
    .populate('faculty', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get courses by department
courseSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ department: departmentId })
    .populate('faculty', 'name email')
    .populate('subject', 'name code')
    .sort({ year: 1, section: 1, semester: 1 });
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
