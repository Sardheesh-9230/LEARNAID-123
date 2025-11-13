const mongoose = require('mongoose');

/**
 * MCQ Session Model
 * Stores MCQ generation sessions with questions and metadata
 */
const mcqSessionSchema = new mongoose.Schema({
  // Faculty who generated the MCQs
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  
  // Subject, Chapter, and Material references
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chapter is required']
  },
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material is required']
  },
  
  // Topic/subtopics for focused generation
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [500, 'Topic cannot exceed 500 characters']
  },
  subtopics: [{
    type: String,
    trim: true,
    maxlength: [200, 'Subtopic cannot exceed 200 characters']
  }],
  
  // MCQ Configuration
  numberOfQuestions: {
    type: Number,
    required: true,
    min: [1, 'Must generate at least 1 question'],
    max: [50, 'Cannot generate more than 50 questions'],
    default: 5
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium'
  },
  
  // Generated MCQs
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: [{
      type: String,
      required: true,
      trim: true
    }],
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    explanation: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    bloomsLevel: {
      type: String,
      enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
    }
  }],
  
  // Generation metadata
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  
  // Statistics
  processingTime: Number, // in milliseconds
  pdfPages: Number,
  textLength: Number,
  chunksProcessed: Number,
  
  // Assignment tracking
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dueDate: Date,
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
mcqSessionSchema.index({ createdBy: 1, createdAt: -1 });
mcqSessionSchema.index({ subject: 1, chapter: 1 });
mcqSessionSchema.index({ material: 1 });
mcqSessionSchema.index({ status: 1 });

// Virtual for question count
mcqSessionSchema.virtual('questionCount').get(function() {
  return this.questions ? this.questions.length : 0;
});

// Method to add generated questions
mcqSessionSchema.methods.addQuestions = function(questions) {
  this.questions = questions;
  this.status = 'completed';
  return this.save();
};

// Method to mark as failed
mcqSessionSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

// Static method to get faculty's MCQ sessions
mcqSessionSchema.statics.getByFaculty = function(facultyId, options = {}) {
  const { page = 1, limit = 10, status, subject } = options;
  
  const query = { createdBy: facultyId };
  if (status) query.status = status;
  if (subject) query.subject = subject;
  
  return this.find(query)
    .populate('subject', 'name code')
    .populate('chapter', 'title chapterNumber')
    .populate('material', 'title type')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

module.exports = mongoose.model('MCQSession', mcqSessionSchema);
