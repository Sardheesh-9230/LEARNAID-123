const mongoose = require('mongoose');

/**
 * Student Mark Entry Model
 * Stores marks for CIA-1, CIA-2, and Model examinations
 */
const studentMarkEntrySchema = new mongoose.Schema({
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
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['CIA1', 'CIA2', 'MODEL'],
    uppercase: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Odd', 'Even']
  },
  
  // Mark Details
  marksObtained: {
    type: Number,
    required: [true, 'Marks obtained is required'],
    min: [0, 'Marks cannot be negative']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  grade: {
    type: String,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F', 'AB'], // AB = Absent
    uppercase: true
  },
  
  // Additional Information
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  isAbsent: {
    type: Boolean,
    default: false
  },
  
  // Question-wise and CO-wise marks breakdown
  questionWiseMarks: [{
    questionNumber: Number,
    unit: Number,
    maxMarks: Number,
    obtainedMarks: Number,
    questionType: String,
    section: String
  }],
  coWiseMarks: [{
    courseOutcome: String,
    maxMarks: Number,
    obtainedMarks: Number
  }],
  
  // Faculty Information
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty who entered marks is required']
  },
  enteredAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Final', 'Published'],
    default: 'Draft'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
studentMarkEntrySchema.index({ student: 1, subject: 1, examType: 1, academicYear: 1 });
studentMarkEntrySchema.index({ subject: 1, examType: 1 });
studentMarkEntrySchema.index({ enteredBy: 1 });
studentMarkEntrySchema.index({ academicYear: 1, semester: 1 });

// Compound unique index to prevent duplicate entries
studentMarkEntrySchema.index({ 
  student: 1, 
  subject: 1, 
  examType: 1, 
  academicYear: 1, 
  semester: 1 
}, { unique: true });

// Virtual for pass/fail status
studentMarkEntrySchema.virtual('isPassed').get(function() {
  if (this.isAbsent) return false;
  
  // Different passing criteria based on exam type
  let passingMarks;
  switch(this.examType) {
    case 'CIA1':
    case 'CIA2':
      passingMarks = 24; // 40% of 60
      break;
    case 'MODEL':
      passingMarks = 40; // 40% of 100
      break;
    default:
      passingMarks = this.totalMarks * 0.4; // 40% as default
  }
  
  return this.marksObtained >= passingMarks;
});

// Virtual for performance category
studentMarkEntrySchema.virtual('performanceCategory').get(function() {
  if (this.isAbsent) return 'Absent';
  if (this.percentage >= 90) return 'Excellent';
  if (this.percentage >= 75) return 'Good';
  if (this.percentage >= 60) return 'Average';
  if (this.percentage >= 40) return 'Below Average';
  return 'Poor';
});

// Pre-save middleware to calculate percentage and grade
studentMarkEntrySchema.pre('save', function(next) {
  if (this.isAbsent) {
    this.grade = 'AB';
    this.percentage = 0;
    return next();
  }

  // Calculate percentage
  this.percentage = Math.round((this.marksObtained / this.totalMarks) * 100 * 100) / 100;
  
  // Calculate grade based on percentage
  if (this.percentage >= 90) this.grade = 'O';
  else if (this.percentage >= 80) this.grade = 'A+';
  else if (this.percentage >= 70) this.grade = 'A';
  else if (this.percentage >= 60) this.grade = 'B+';
  else if (this.percentage >= 50) this.grade = 'B';
  else if (this.percentage >= 40) this.grade = 'C';
  else this.grade = 'F';
  
  // Set modification timestamp
  if (this.isModified() && !this.isNew) {
    this.lastModifiedAt = Date.now();
  }
  
  next();
});

// Static methods

// Get marks by subject and exam type
studentMarkEntrySchema.statics.findBySubjectAndExam = function(subjectId, examType, academicYear = '2024-2025', semester = 'Odd') {
  return this.find({
    subject: subjectId,
    examType: examType.toUpperCase(),
    academicYear,
    semester
  })
  .populate('student', 'name rollNumber email department year section')
  .populate('enteredBy', 'name email')
  .sort({ 'student.rollNumber': 1 });
};

// Get student's all marks for a subject
studentMarkEntrySchema.statics.findStudentSubjectMarks = function(studentId, subjectId, academicYear = '2024-2025', includeUnpublished = false) {
  const query = {
    student: studentId,
    subject: subjectId,
    academicYear
  };
  
  // Students can only see Published marks
  if (!includeUnpublished) {
    query.status = 'Published';
  }
  
  return this.find(query)
    .populate('subject', 'name code')
    .sort({ examType: 1 });
};

// Get marks statistics for a subject and exam
studentMarkEntrySchema.statics.getSubjectExamStatistics = async function(subjectId, examType, academicYear = '2024-2025', semester = 'Odd') {
  const marks = await this.find({
    subject: subjectId,
    examType: examType.toUpperCase(),
    academicYear,
    semester
  });

  if (marks.length === 0) {
    return {
      totalStudents: 0,
      marksEntered: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      passed: 0,
      failed: 0,
      absent: 0,
      passPercentage: 0
    };
  }

  const presentMarks = marks.filter(m => !m.isAbsent);
  const absentCount = marks.filter(m => m.isAbsent).length;
  const passedCount = marks.filter(m => m.isPassed).length;
  
  const marksArray = presentMarks.map(m => m.marksObtained);
  const average = presentMarks.length > 0 ? marksArray.reduce((sum, mark) => sum + mark, 0) / presentMarks.length : 0;

  return {
    totalStudents: marks.length,
    marksEntered: marks.length,
    average: Math.round(average * 100) / 100,
    highest: presentMarks.length > 0 ? Math.max(...marksArray) : 0,
    lowest: presentMarks.length > 0 ? Math.min(...marksArray) : 0,
    passed: passedCount,
    failed: presentMarks.length - passedCount,
    absent: absentCount,
    passPercentage: marks.length > 0 ? Math.round((passedCount / marks.length) * 100 * 100) / 100 : 0
  };
};

// Get faculty's mark entry summary
studentMarkEntrySchema.statics.getFacultyMarksSummary = async function(facultyId, academicYear = '2024-2025') {
  return await this.aggregate([
    {
      $match: {
        enteredBy: facultyId,
        academicYear: academicYear
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subject',
        foreignField: '_id',
        as: 'subjectInfo'
      }
    },
    {
      $unwind: '$subjectInfo'
    },
    {
      $group: {
        _id: {
          subject: '$subject',
          examType: '$examType'
        },
        subjectName: { $first: '$subjectInfo.name' },
        subjectCode: { $first: '$subjectInfo.code' },
        examType: { $first: '$examType' },
        totalMarks: { $sum: 1 },
        averageMarks: { $avg: '$marksObtained' },
        passed: {
          $sum: {
            $cond: [
              { $eq: ['$isPassed', true] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: {
        'subjectName': 1,
        'examType': 1
      }
    }
  ]);
};

// Instance methods
studentMarkEntrySchema.methods.toJSON = function() {
  const markEntry = this.toObject();
  markEntry.id = markEntry._id.toString();
  return markEntry;
};

const StudentMarkEntry = mongoose.model('StudentMarkEntry', studentMarkEntrySchema);

module.exports = StudentMarkEntry;