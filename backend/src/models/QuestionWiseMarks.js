const mongoose = require('mongoose');

/**
 * Question-wise Marks Model
 * Stores individual question marks for detailed CO performance analysis
 */
const questionWiseMarksSchema = new mongoose.Schema({
  studentMarkEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentMarkEntry',
    required: [true, 'Student mark entry is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CIAExam',
    required: [true, 'Exam is required']
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['CIA1', 'CIA2', 'MODEL']
  },
  
  // Question details
  questionNumber: {
    type: Number,
    required: [true, 'Question number is required'],
    min: [1, 'Question number must be at least 1']
  },
  questionText: {
    type: String,
    maxlength: [2000, 'Question text cannot exceed 2000 characters']
  },
  
  // Marks details
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks cannot be negative']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: [1, 'Maximum marks must be at least 1']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  
  // CO Analysis fields
  courseOutcome: {
    type: String,
    required: [true, 'Course Outcome is required for analysis'],
    enum: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6']
  },
  unit: {
    type: Number,
    required: [true, 'Unit number is required'],
    min: [1, 'Unit must be at least 1'],
    max: [5, 'Unit cannot exceed 5']
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  
  // Question classification
  questionType: {
    type: String,
    enum: ['2mark', '16mark', 'MCQ', 'Short Answer', 'Long Answer'],
    default: '2mark'
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'A'
  },
  
  // Bloom's taxonomy level
  bloomsLevel: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
    default: 'L1'
  },
  
  // Academic context
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Odd', 'Even']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
questionWiseMarksSchema.index({ student: 1, courseOutcome: 1 });
questionWiseMarksSchema.index({ subject: 1, courseOutcome: 1 });
questionWiseMarksSchema.index({ studentMarkEntry: 1 });
questionWiseMarksSchema.index({ exam: 1, courseOutcome: 1 });
questionWiseMarksSchema.index({ academicYear: 1, semester: 1 });

// Virtual for performance status
questionWiseMarksSchema.virtual('isAttained').get(function() {
  return this.percentage >= 50; // CO attainment threshold
});

// Pre-save middleware to calculate percentage
questionWiseMarksSchema.pre('save', function(next) {
  this.percentage = Math.round((this.marksObtained / this.maxMarks) * 100 * 100) / 100;
  next();
});

// Static method to get CO performance for a student
questionWiseMarksSchema.statics.getCOPerformance = async function(studentId, subjectId, academicYear = '2024-2025') {
  return this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        subject: new mongoose.Types.ObjectId(subjectId),
        academicYear: academicYear
      }
    },
    {
      $group: {
        _id: '$courseOutcome',
        totalMarks: { $sum: '$maxMarks' },
        obtainedMarks: { $sum: '$marksObtained' },
        questionCount: { $sum: 1 },
        examTypes: { $addToSet: '$examType' }
      }
    },
    {
      $project: {
        courseOutcome: '$_id',
        totalMarks: 1,
        obtainedMarks: 1,
        questionCount: 1,
        examTypes: 1,
        percentage: {
          $round: [{
            $multiply: [
              { $divide: ['$obtainedMarks', '$totalMarks'] },
              100
            ]
          }, 2]
        },
        attainment: {
          $cond: [
            { $gte: [{
              $multiply: [
                { $divide: ['$obtainedMarks', '$totalMarks'] },
                100
              ]
            }, 50] },
            'Attained',
            'Not Attained'
          ]
        }
      }
    },
    { $sort: { courseOutcome: 1 } }
  ]);
};

// Static method to get overall CO performance for a subject
questionWiseMarksSchema.statics.getSubjectCOAnalysis = async function(subjectId, academicYear = '2024-2025') {
  return this.aggregate([
    {
      $match: {
        subject: new mongoose.Types.ObjectId(subjectId),
        academicYear: academicYear
      }
    },
    {
      $group: {
        _id: {
          student: '$student',
          courseOutcome: '$courseOutcome'
        },
        totalMarks: { $sum: '$maxMarks' },
        obtainedMarks: { $sum: '$marksObtained' },
        percentage: {
          $avg: '$percentage'
        }
      }
    },
    {
      $group: {
        _id: '$_id.courseOutcome',
        students: {
          $push: {
            student: '$_id.student',
            totalMarks: '$totalMarks',
            obtainedMarks: '$obtainedMarks',
            percentage: '$percentage',
            attained: { $gte: ['$percentage', 50] }
          }
        },
        averageAttainment: { $avg: '$percentage' },
        totalStudents: { $sum: 1 },
        attainedStudents: {
          $sum: {
            $cond: [{ $gte: ['$percentage', 50] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        courseOutcome: '$_id',
        students: 1,
        averageAttainment: { $round: ['$averageAttainment', 2] },
        totalStudents: 1,
        attainedStudents: 1,
        attainmentPercentage: {
          $round: [{
            $multiply: [
              { $divide: ['$attainedStudents', '$totalStudents'] },
              100
            ]
          }, 2]
        }
      }
    },
    { $sort: { courseOutcome: 1 } }
  ]);
};

const QuestionWiseMarks = mongoose.model('QuestionWiseMarks', questionWiseMarksSchema);

module.exports = QuestionWiseMarks;