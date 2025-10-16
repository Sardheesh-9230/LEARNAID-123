const mongoose = require('mongoose');

/**
 * Exam Question Model
 * Represents individual questions in a CIA exam with chapter mapping
 */
const examQuestionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CIAExam',
    required: [true, 'Exam is required']
  },
  questionNumber: {
    type: Number,
    required: [true, 'Question number is required'],
    min: [1, 'Question number must be at least 1']
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    maxlength: [2000, 'Question text cannot exceed 2000 characters']
  },
  questionType: {
    type: String,
    enum: ['Short Answer', 'Long Answer', 'MCQ', 'True/False', 'Fill in the Blank', 'Numerical'],
    default: 'Short Answer'
  },
  
  // Chapter Mapping - Key feature for performance tracking
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chapter mapping is required for performance analysis']
  },
  
  // Topics covered (optional, for more granular tracking)
  topics: [{
    type: String,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  }],
  
  // Marks allocation
  totalMarks: {
    type: Number,
    required: [true, 'Total marks for question is required'],
    min: [0.5, 'Marks must be at least 0.5'],
    max: [100, 'Marks cannot exceed 100']
  },
  
  // For MCQ questions
  options: [{
    optionText: {
      type: String,
      maxlength: [500, 'Option text cannot exceed 500 characters']
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  
  // Correct answer (for non-MCQ questions)
  correctAnswer: {
    type: String,
    maxlength: [2000, 'Correct answer cannot exceed 2000 characters']
  },
  
  // Evaluation rubric
  rubric: {
    type: String,
    maxlength: [1000, 'Rubric cannot exceed 1000 characters']
  },
  
  // Difficulty level
  difficultyLevel: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  
  // Bloom's Taxonomy Level
  bloomsLevel: {
    type: String,
    enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    default: 'Remember'
  },
  
  // Question metadata
  displayOrder: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for exam and question number uniqueness
examQuestionSchema.index({ exam: 1, questionNumber: 1 }, { unique: true });
examQuestionSchema.index({ exam: 1, chapter: 1 });
examQuestionSchema.index({ chapter: 1 });
examQuestionSchema.index({ difficultyLevel: 1 });

// Methods
examQuestionSchema.methods.toJSON = function() {
  const question = this.toObject();
  question.id = question._id.toString();
  return question;
};

// Static method to get questions by exam
examQuestionSchema.statics.findByExam = function(examId) {
  return this.find({ exam: examId, isActive: true })
    .populate('chapter', 'title chapterNumber')
    .sort({ displayOrder: 1, questionNumber: 1 });
};

// Static method to get questions by chapter
examQuestionSchema.statics.findByChapter = function(chapterId) {
  return this.find({ chapter: chapterId, isActive: true })
    .populate('exam', 'title examType')
    .sort({ createdAt: -1 });
};

// Static method to get chapter-wise question distribution
examQuestionSchema.statics.getChapterDistribution = async function(examId) {
  return this.aggregate([
    { $match: { exam: mongoose.Types.ObjectId(examId), isActive: true } },
    {
      $group: {
        _id: '$chapter',
        questionCount: { $sum: 1 },
        totalMarks: { $sum: '$totalMarks' },
        questions: { $push: { number: '$questionNumber', marks: '$totalMarks' } }
      }
    },
    {
      $lookup: {
        from: 'chapters',
        localField: '_id',
        foreignField: '_id',
        as: 'chapterInfo'
      }
    },
    { $unwind: '$chapterInfo' },
    {
      $project: {
        chapterId: '$_id',
        chapterTitle: '$chapterInfo.title',
        chapterNumber: '$chapterInfo.chapterNumber',
        questionCount: 1,
        totalMarks: 1,
        questions: 1
      }
    },
    { $sort: { chapterNumber: 1 } }
  ]);
};

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

module.exports = ExamQuestion;
