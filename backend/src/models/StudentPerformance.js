const mongoose = require('mongoose');

/**
 * Student Performance Model
 * Aggregated performance metrics for students
 */
const studentPerformanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    unique: false // Allow multiple entries for different courses/subjects
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  
  // Chapter-wise performance
  chapterPerformance: [{
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    totalAttempts: {
      type: Number,
      default: 0
    },
    totalMarksObtained: {
      type: Number,
      default: 0
    },
    totalPossibleMarks: {
      type: Number,
      default: 0
    },
    averagePercentage: {
      type: Number,
      default: 0
    },
    performanceCategory: {
      type: String,
      enum: ['Strong', 'Average', 'Weak', 'Not Attempted'],
      default: 'Not Attempted'
    },
    lastAttemptDate: Date
  }],
  
  // Overall metrics
  overallMetrics: {
    totalExamsAttempted: {
      type: Number,
      default: 0
    },
    totalMarksObtained: {
      type: Number,
      default: 0
    },
    totalPossibleMarks: {
      type: Number,
      default: 0
    },
    overallPercentage: {
      type: Number,
      default: 0
    },
    currentGrade: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', 'Not Graded'],
      default: 'Not Graded'
    }
  },
  
  // Weak areas identification
  weakChapters: [{
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    },
    percentage: Number,
    needsImprovement: Boolean
  }],
  
  // Strong areas
  strongChapters: [{
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    },
    percentage: Number
  }],
  
  // Task assignments count
  tasksAssigned: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  taskCompletionRate: {
    type: Number,
    default: 0
  },
  
  // Improvement tracking
  improvementTrend: {
    type: String,
    enum: ['Improving', 'Stable', 'Declining', 'Insufficient Data'],
    default: 'Insufficient Data'
  },
  
  // Last updated
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  
  // Academic year
  academicYear: {
    type: String,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
studentPerformanceSchema.index({ student: 1, course: 1 });
studentPerformanceSchema.index({ student: 1, subject: 1 });
studentPerformanceSchema.index({ 'overallMetrics.overallPercentage': -1 });
studentPerformanceSchema.index({ improvementTrend: 1 });

// Methods
studentPerformanceSchema.methods.toJSON = function() {
  const performance = this.toObject();
  performance.id = performance._id.toString();
  return performance;
};

// Method to update chapter performance
studentPerformanceSchema.methods.updateChapterPerformance = function(chapterId, marksObtained, totalMarks) {
  const chapterIndex = this.chapterPerformance.findIndex(
    cp => cp.chapter.toString() === chapterId.toString()
  );
  
  if (chapterIndex > -1) {
    // Update existing chapter performance
    const cp = this.chapterPerformance[chapterIndex];
    cp.totalAttempts += 1;
    cp.totalMarksObtained += marksObtained;
    cp.totalPossibleMarks += totalMarks;
    cp.averagePercentage = (cp.totalMarksObtained / cp.totalPossibleMarks) * 100;
    cp.lastAttemptDate = new Date();
    
    // Update performance category
    if (cp.averagePercentage >= 75) {
      cp.performanceCategory = 'Strong';
    } else if (cp.averagePercentage >= 50) {
      cp.performanceCategory = 'Average';
    } else {
      cp.performanceCategory = 'Weak';
    }
  } else {
    // Add new chapter performance
    const percentage = (marksObtained / totalMarks) * 100;
    let category = 'Weak';
    if (percentage >= 75) category = 'Strong';
    else if (percentage >= 50) category = 'Average';
    
    this.chapterPerformance.push({
      chapter: chapterId,
      totalAttempts: 1,
      totalMarksObtained: marksObtained,
      totalPossibleMarks: totalMarks,
      averagePercentage: percentage,
      performanceCategory: category,
      lastAttemptDate: new Date()
    });
  }
  
  return this;
};

// Method to recalculate overall metrics
studentPerformanceSchema.methods.recalculateOverallMetrics = function() {
  let totalMarks = 0;
  let totalPossible = 0;
  let attempts = 0;
  
  this.chapterPerformance.forEach(cp => {
    totalMarks += cp.totalMarksObtained;
    totalPossible += cp.totalPossibleMarks;
    attempts += cp.totalAttempts;
  });
  
  this.overallMetrics.totalMarksObtained = totalMarks;
  this.overallMetrics.totalPossibleMarks = totalPossible;
  this.overallMetrics.totalExamsAttempted = attempts;
  this.overallMetrics.overallPercentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
  
  // Update grade
  const percentage = this.overallMetrics.overallPercentage;
  if (percentage >= 90) this.overallMetrics.currentGrade = 'O';
  else if (percentage >= 80) this.overallMetrics.currentGrade = 'A+';
  else if (percentage >= 70) this.overallMetrics.currentGrade = 'A';
  else if (percentage >= 60) this.overallMetrics.currentGrade = 'B+';
  else if (percentage >= 50) this.overallMetrics.currentGrade = 'B';
  else if (percentage >= 40) this.overallMetrics.currentGrade = 'C';
  else this.overallMetrics.currentGrade = 'F';
  
  // Update weak and strong chapters
  this.weakChapters = this.chapterPerformance
    .filter(cp => cp.averagePercentage < 50)
    .map(cp => ({
      chapter: cp.chapter,
      percentage: cp.averagePercentage,
      needsImprovement: true
    }));
  
  this.strongChapters = this.chapterPerformance
    .filter(cp => cp.averagePercentage >= 75)
    .map(cp => ({
      chapter: cp.chapter,
      percentage: cp.averagePercentage
    }));
  
  // Update task completion rate
  if (this.tasksAssigned > 0) {
    this.taskCompletionRate = (this.tasksCompleted / this.tasksAssigned) * 100;
  }
  
  this.lastCalculated = new Date();
  
  return this;
};

// Static method to get performance by student
studentPerformanceSchema.statics.findByStudent = function(studentId) {
  return this.findOne({ student: studentId })
    .populate('course', 'name code')
    .populate('subject', 'name code')
    .populate('chapterPerformance.chapter', 'title chapterNumber')
    .populate('weakChapters.chapter', 'title chapterNumber')
    .populate('strongChapters.chapter', 'title chapterNumber');
};

// Static method to get weak performers
studentPerformanceSchema.statics.getWeakPerformers = function(courseId, threshold = 50) {
  const query = { 'overallMetrics.overallPercentage': { $lt: threshold } };
  if (courseId) {
    query.course = courseId;
  }
  
  return this.find(query)
    .populate('student', 'name email studentId')
    .populate('course', 'name code')
    .sort({ 'overallMetrics.overallPercentage': 1 });
};

const StudentPerformance = mongoose.model('StudentPerformance', studentPerformanceSchema);

module.exports = StudentPerformance;
