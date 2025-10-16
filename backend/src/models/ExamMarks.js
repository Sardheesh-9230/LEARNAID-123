const mongoose = require('mongoose');

/**
 * Exam Marks Model
 * Stores individual student marks for each question with chapter-wise performance calculation
 */
const examMarksSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CIAExam',
    required: [true, 'Exam is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamQuestion',
    required: [true, 'Question is required']
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chapter is required']
  },
  
  // Marks details
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks cannot be negative']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [0, 'Total marks cannot be negative']
  },
  
  // Student answer (optional, for review)
  studentAnswer: {
    type: String,
    maxlength: [5000, 'Answer cannot exceed 5000 characters']
  },
  
  // Faculty feedback
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  
  // Evaluation details
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedAt: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Evaluated', 'Re-evaluation Requested'],
    default: 'Pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for uniqueness
examMarksSchema.index({ exam: 1, student: 1, question: 1 }, { unique: true });
examMarksSchema.index({ exam: 1, student: 1 });
examMarksSchema.index({ student: 1, chapter: 1 });
examMarksSchema.index({ chapter: 1 });

// Methods
examMarksSchema.methods.toJSON = function() {
  const marks = this.toObject();
  marks.id = marks._id.toString();
  marks.percentage = ((marks.marksObtained / marks.totalMarks) * 100).toFixed(2);
  return marks;
};

// Calculate percentage
examMarksSchema.methods.getPercentage = function() {
  return ((this.marksObtained / this.totalMarks) * 100).toFixed(2);
};

// Static method to get marks by exam and student
examMarksSchema.statics.findByExamAndStudent = function(examId, studentId) {
  return this.find({ exam: examId, student: studentId })
    .populate('question', 'questionNumber questionText totalMarks')
    .populate('chapter', 'title chapterNumber')
    .sort({ 'question.questionNumber': 1 });
};

// Static method to calculate chapter-wise performance for a student in an exam
examMarksSchema.statics.getChapterWisePerformance = async function(examId, studentId) {
  return this.aggregate([
    {
      $match: {
        exam: mongoose.Types.ObjectId(examId),
        student: mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $group: {
        _id: '$chapter',
        totalMarksObtained: { $sum: '$marksObtained' },
        totalPossibleMarks: { $sum: '$totalMarks' },
        questionCount: { $sum: 1 },
        averagePercentage: {
          $avg: { $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100] }
        }
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
        totalMarksObtained: 1,
        totalPossibleMarks: 1,
        questionCount: 1,
        percentage: {
          $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100]
        },
        performanceCategory: {
          $cond: {
            if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 75] },
            then: 'Strong',
            else: {
              $cond: {
                if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 50] },
                then: 'Average',
                else: 'Weak'
              }
            }
          }
        }
      }
    },
    { $sort: { chapterNumber: 1 } }
  ]);
};

// Static method to identify weak students by chapter
examMarksSchema.statics.getWeakStudentsByChapter = async function(examId, chapterId, threshold = 50) {
  return this.aggregate([
    {
      $match: {
        exam: mongoose.Types.ObjectId(examId),
        chapter: mongoose.Types.ObjectId(chapterId)
      }
    },
    {
      $group: {
        _id: '$student',
        totalMarksObtained: { $sum: '$marksObtained' },
        totalPossibleMarks: { $sum: '$totalMarks' },
        percentage: {
          $multiply: [
            { $divide: [{ $sum: '$marksObtained' }, { $sum: '$totalMarks' }] },
            100
          ]
        }
      }
    },
    {
      $match: {
        percentage: { $lt: threshold }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    {
      $project: {
        studentId: '$_id',
        studentName: '$studentInfo.name',
        studentEmail: '$studentInfo.email',
        studentRollNumber: '$studentInfo.studentId',
        marksObtained: '$totalMarksObtained',
        totalMarks: '$totalPossibleMarks',
        percentage: 1
      }
    },
    { $sort: { percentage: 1 } }
  ]);
};

// Static method to calculate overall exam performance
examMarksSchema.statics.getExamPerformance = async function(examId) {
  return this.aggregate([
    { $match: { exam: mongoose.Types.ObjectId(examId) } },
    {
      $group: {
        _id: '$student',
        totalMarksObtained: { $sum: '$marksObtained' },
        totalPossibleMarks: { $sum: '$totalMarks' }
      }
    },
    {
      $project: {
        studentId: '$_id',
        marksObtained: '$totalMarksObtained',
        totalMarks: '$totalPossibleMarks',
        percentage: {
          $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100]
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $project: {
        studentId: 1,
        studentName: '$student.name',
        studentEmail: '$student.email',
        rollNumber: '$student.studentId',
        marksObtained: 1,
        totalMarks: 1,
        percentage: 1,
        grade: {
          $cond: {
            if: { $gte: ['$percentage', 90] },
            then: 'O',
            else: {
              $cond: {
                if: { $gte: ['$percentage', 80] },
                then: 'A+',
                else: {
                  $cond: {
                    if: { $gte: ['$percentage', 70] },
                    then: 'A',
                    else: {
                      $cond: {
                        if: { $gte: ['$percentage', 60] },
                        then: 'B+',
                        else: {
                          $cond: {
                            if: { $gte: ['$percentage', 50] },
                            then: 'B',
                            else: 'F'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    { $sort: { percentage: -1 } }
  ]);
};

// Pre-save validation
examMarksSchema.pre('save', function(next) {
  if (this.marksObtained > this.totalMarks) {
    next(new Error('Marks obtained cannot exceed total marks'));
  }
  next();
});

const ExamMarks = mongoose.model('ExamMarks', examMarksSchema);

module.exports = ExamMarks;
