const mongoose = require('mongoose');

/**
 * Improvement Task Model
 * Represents improvement tasks assigned to students based on poor performance
 */
const improvementTaskSchema = new mongoose.Schema({
  // Basic task information
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  taskType: {
    type: String,
    enum: ['CO_IMPROVEMENT', 'SUBJECT_IMPROVEMENT', 'GENERAL_IMPROVEMENT', 'CO_ASSESSMENT'],
    default: 'CO_IMPROVEMENT'
  },
  
  // Student and assignment information
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Student is required only if studentAssignments is empty (single-student tasks)
      return !this.studentAssignments || this.studentAssignments.length === 0;
    }
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by is required']
  },
  
  // Multi-student assignment support (for CO_ASSESSMENT tasks)
  studentAssignments: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    weakCOs: [{
      courseOutcome: String,
      coNumber: Number,
      performanceGap: Number,
      topics: [String]
    }],
    personalizedQuestions: [{
      id: String,
      question: String,
      options: [String],
      correctAnswer: mongoose.Schema.Types.Mixed,
      explanation: String,
      courseOutcome: String,
      coNumber: Number,
      topics: [String],
      marks: Number,
      difficulty: String,
      bloomsLevel: String,
      estimatedTime: Number
    }],
    totalMarks: Number,
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Completed', 'Overdue'],
      default: 'Assigned'
    },
    scores: [{
      score: Number,
      percentage: Number,
      timestamp: Date,
      attemptNumber: Number,
      timeSpent: Number
    }],
    attemptCount: {
      type: Number,
      default: 0
    }
  }],
  
  // Task details
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['Assigned', 'In Progress', 'Completed', 'Overdue'],
    default: 'Assigned'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // CO-specific identification
  courseOutcome: {
    type: String,
    trim: true,
    maxlength: [50, 'Course outcome cannot exceed 50 characters']
  },
  coNumber: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        if (v === null || v === undefined) return true;
        if (typeof v === 'number') return v >= 1 && v <= 10;
        if (Array.isArray(v)) return v.every(n => typeof n === 'number' && n >= 1 && n <= 10);
        if (typeof v === 'string') return true; // Allow string for comma-separated values
        return false;
      },
      message: 'coNumber must be a number (1-10), array of numbers, or comma-separated string'
    }
  },
  
  // Performance-specific metadata
  metadata: {
    currentPerformance: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    targetPerformance: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    studyTimeMinutes: {
      type: Number,
      default: 90,
      min: 0
    },
    studyTimeCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    weakAreas: [{
      type: String,
      trim: true
    }],
    // CO-specific weak areas
    coWeakAreas: [{
      co: String,
      topics: [String],
      performanceGap: Number
    }],
    generatedMCQs: {
      totalQuestions: {
        type: Number,
        default: 0
      },
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MCQSession'
      },
      questions: [{
        id: String,
        question: String,
        options: [String],
        correctAnswer: mongoose.Schema.Types.Mixed, // Support both number index and string
        explanation: String,
        area: String,
        courseOutcome: String,
        coNumber: mongoose.Schema.Types.Mixed, // Support both single number and array
        topics: [String], // Support topic tags
        marks: Number, // Support marks per question
        difficulty: {
          type: String,
          enum: ['Easy', 'Medium', 'Hard'],
          default: 'Medium'
        },
        bloomsLevel: {
          type: String,
          enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create', 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
        },
        estimatedTime: Number
      }],
      difficultyLevel: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
        default: 'Medium'
      },
      focusedCO: String,
      estimatedTime: Number,
      areas: [String],
      numberOfQuestions: Number, // Add explicit numberOfQuestions field
      needsGeneration: Boolean, // Add needsGeneration flag
      materialUsed: String, // Add materialUsed field
      generatedAt: Date,
      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Teacher-set parameters
    teacherSettings: {
      examType: String, // Add exam type field
      difficultyLevel: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
        default: 'Medium'
      },
      scheduledStartTime: Date,
      scheduledEndTime: Date,
      numberOfQuestions: {
        type: Number,
        default: 10,
        min: 5,
        max: 50
      },
      focusAreas: [String],
      courseOutcomes: [String], // Add course outcomes array
      allowRetake: {
        type: Boolean,
        default: true
      },
      maxAttempts: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
      },
      shuffleQuestions: {
        type: Boolean,
        default: false
      },
      showResultsImmediately: {
        type: Boolean,
        default: true
      },
      totalMarks: {
        type: Number,
        min: 0
      },
      coBreakdown: [{ // Add CO breakdown array
        coNumber: Number,
        topics: [String],
        questions: Number,
        marks: Number
      }]
    },
    autoAssigned: {
      type: Boolean,
      default: true
    },
    assignmentReason: {
      type: String,
      default: 'Poor performance analysis'
    },
    mcqScores: [{
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      totalQuestions: {
        type: Number,
        default: 10
      }
    }]
  },
  
  // Task requirements
  requirements: [{
    type: String,
    trim: true
  }],
  
  // Study materials
  studyMaterials: [{
    type: {
      type: String,
      enum: ['MCQ_SET', 'STUDY_GUIDE', 'VIDEO', 'PDF', 'LINK'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: mongoose.Schema.Types.Mixed,
    estimatedTime: {
      type: Number, // in minutes
      default: 0
    }
  }],
  
  // Progress tracking
  progressNotes: [{
    note: {
      type: String,
      required: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Completion tracking
  startedAt: Date,
  completedAt: Date,
  
  // Academic context
  academicYear: {
    type: String,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  },
  semester: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
improvementTaskSchema.index({ student: 1, status: 1 });
improvementTaskSchema.index({ subject: 1 });
improvementTaskSchema.index({ assignedBy: 1 });
improvementTaskSchema.index({ dueDate: 1, status: 1 });
improvementTaskSchema.index({ 'metadata.autoAssigned': 1 });
improvementTaskSchema.index({ taskType: 1 });

// Virtual for formatted due date
improvementTaskSchema.virtual('formattedDueDate').get(function() {
  return this.dueDate ? this.dueDate.toLocaleDateString() : null;
});

// Virtual for time remaining
improvementTaskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diff = this.dueDate.getTime() - now.getTime();
  if (diff < 0) return 'Overdue';
  
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return '1 day remaining';
  if (days > 1) return `${days} days remaining`;
  
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  return `${hours} hours remaining`;
});

// Virtual for completion status
improvementTaskSchema.virtual('isCompleted').get(function() {
  return this.status === 'Completed';
});

// Method to update progress
improvementTaskSchema.methods.updateProgress = function(updates) {
  if (updates.status) this.status = updates.status;
  if (updates.progressPercentage !== undefined) this.progressPercentage = updates.progressPercentage;
  if (updates.studyTimeCompleted) {
    this.metadata.studyTimeCompleted = (this.metadata.studyTimeCompleted || 0) + updates.studyTimeCompleted;
  }
  if (updates.mcqScore !== undefined) {
    if (!this.metadata.mcqScores) this.metadata.mcqScores = [];
    this.metadata.mcqScores.push({
      score: updates.mcqScore,
      timestamp: new Date(),
      totalQuestions: updates.totalQuestions || 10
    });
  }
  if (updates.notes) {
    if (!this.progressNotes) this.progressNotes = [];
    this.progressNotes.push({
      note: updates.notes,
      timestamp: new Date(),
      addedBy: updates.addedBy
    });
  }
  
  // Auto-complete task if criteria met
  if (this.metadata.studyTimeCompleted >= this.metadata.studyTimeMinutes && 
      this.metadata.mcqScores && 
      this.metadata.mcqScores.some(score => score.score >= 70)) {
    this.status = 'Completed';
    this.completedAt = new Date();
    this.progressPercentage = 100;
  }
  
  return this;
};

// Method to check if overdue
improvementTaskSchema.methods.checkOverdue = function() {
  if (this.status !== 'Completed' && new Date() > this.dueDate) {
    this.status = 'Overdue';
    return true;
  }
  return false;
};

// Static method to find tasks by student
improvementTaskSchema.statics.findByStudent = function(studentId, options = {}) {
  const query = { student: studentId };
  
  if (options.status) {
    if (Array.isArray(options.status)) {
      query.status = { $in: options.status };
    } else {
      query.status = options.status;
    }
  }
  
  if (options.taskType) {
    query.taskType = options.taskType;
  }
  
  return this.find(query)
    .populate('subject', 'name code credits')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find overdue tasks
improvementTaskSchema.statics.findOverdue = function() {
  return this.find({
    status: { $in: ['Assigned', 'In Progress'] },
    dueDate: { $lt: new Date() }
  })
    .populate('student', 'name email rollNumber')
    .populate('subject', 'name code');
};

// Pre-save middleware to update status
improvementTaskSchema.pre('save', function(next) {
  // Update overdue status
  this.checkOverdue();
  
  // Set started date if status changed to In Progress
  if (this.status === 'In Progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  next();
});

const ImprovementTask = mongoose.model('ImprovementTask', improvementTaskSchema);

module.exports = ImprovementTask;