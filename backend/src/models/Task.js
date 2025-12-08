const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  courseOutcome: {
    type: String,
    required: true,
    enum: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  marks: {
    type: Number,
    default: 1
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  courseOutcomes: [{
    type: String,
    enum: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'],
    required: true
  }],
  // CO Performance tracking
  coPerformanceData: [{
    courseOutcome: {
      type: String,
      enum: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']
    },
    currentPerformance: Number, // percentage
    targetPerformance: Number, // percentage
    performanceGap: Number // percentage
  }],
  questions: [questionSchema],
  assignedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['assigned', 'studying', 'in-progress', 'completed', 'overdue'],
      default: 'assigned'
    },
    studyStartTime: Date,
    taskStartTime: Date,
    completedTime: Date,
    score: Number,
    answers: [{
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean
    }]
  }],
  studyMaterials: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'text', 'link']
    },
    url: String,
    content: String
  }],
  taskSchedule: {
    studyDuration: {
      type: Number, // in minutes
      default: 60
    },
    taskDuration: {
      type: Number, // in minutes  
      default: 30
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    studyStartTime: Date, // Auto-calculated: startTime - studyDuration
    isActive: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    allowChatbot: {
      type: Boolean,
      default: true
    },
    showResourcesDuringTask: {
      type: Boolean,
      default: false
    },
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    passingScore: {
      type: Number,
      default: 60
    }
  },
  // CO Performance tracking for lagging CO assignments
  coPerformanceData: [{
    courseOutcome: {
      type: String,
      enum: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']
    },
    currentPerformance: Number, // percentage
    targetPerformance: Number, // percentage
    performanceGap: Number // percentage
  }],
  metadata: {
    assignmentType: {
      type: String,
      enum: ['co_performance_based', 'faculty_bulk_assignment'],
      default: 'co_performance_based'
    },
    assignmentReason: String,
    targetCourseOutcomes: [String],
    classAssignment: {
      type: Boolean,
      default: false
    },
    coAnalysisData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Calculate study start time before saving
taskSchema.pre('save', function(next) {
  if (this.taskSchedule.startTime && this.taskSchedule.studyDuration) {
    this.taskSchedule.studyStartTime = new Date(
      this.taskSchedule.startTime.getTime() - (this.taskSchedule.studyDuration * 60000)
    );
  }
  next();
});

// Methods
taskSchema.methods.isStudyTime = function() {
  const now = new Date();
  return now >= this.taskSchedule.studyStartTime && now < this.taskSchedule.startTime;
};

taskSchema.methods.isTaskTime = function() {
  const now = new Date();
  return now >= this.taskSchedule.startTime && now <= this.taskSchedule.endTime;
};

taskSchema.methods.isOverdue = function() {
  const now = new Date();
  return now > this.taskSchedule.endTime;
};

module.exports = mongoose.model('Task', taskSchema);