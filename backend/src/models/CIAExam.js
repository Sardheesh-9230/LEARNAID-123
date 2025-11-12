const mongoose = require('mongoose');

/**
 * CIA Exam Model
 * Represents CIA (Continuous Internal Assessment) exams
 */
const ciaExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Exam title cannot exceed 200 characters']
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['CIA1', 'CIA2', 'CIA3', 'Semester', 'Assignment', 'Quiz', 'Other'],
    default: 'CIA1'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C']
  },
  
  // Exam Details
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1'],
    max: [100, 'Total marks cannot exceed 100']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [300, 'Duration cannot exceed 300 minutes']
  },
  
  // Exam Schedule
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
  },
  
  // Instructions
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  
  // Faculty Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for questions
ciaExamSchema.virtual('questions', {
  ref: 'ExamQuestion',
  localField: '_id',
  foreignField: 'exam',
  justOne: false
});

// Virtual for marks entries
ciaExamSchema.virtual('marksEntries', {
  ref: 'ExamMarks',
  localField: '_id',
  foreignField: 'exam',
  justOne: false
});

// Indexes
ciaExamSchema.index({ course: 1, examType: 1 });
ciaExamSchema.index({ subject: 1, section: 1 });
ciaExamSchema.index({ scheduledDate: 1, status: 1 });
ciaExamSchema.index({ createdBy: 1 });

// Methods
ciaExamSchema.methods.toJSON = function() {
  const exam = this.toObject();
  exam.id = exam._id.toString();
  return exam;
};

// Static method to get exams by faculty
ciaExamSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ createdBy: facultyId })
    .populate('course', 'name code')
    .populate('subject', 'name code')
    .populate('department', 'name code')
    .sort({ scheduledDate: -1 });
};

// Static method to get exams by course
ciaExamSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId })
    .populate('createdBy', 'name email')
    .sort({ scheduledDate: -1 });
};

// Pre-save middleware to validate passing marks
ciaExamSchema.pre('save', function(next) {
  if (this.passingMarks > this.totalMarks) {
    next(new Error('Passing marks cannot exceed total marks'));
  }
  next();
});

const CIAExam = mongoose.model('CIAExam', ciaExamSchema);

module.exports = CIAExam;
