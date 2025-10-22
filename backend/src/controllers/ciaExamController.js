const CIAExam = require('../models/CIAExam');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new CIA exam
 * @route   POST /api/exams
 * @access  Private/Faculty
 */
exports.createExam = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      title,
      examType,
      course,
      subject,
      department,
      scheduledDate,
      duration,
      totalMarks,
      passingMarks,
      instructions,
      chaptersIncluded
    } = req.body;

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && courseExists.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create exam for this course'
      });
    }

    // Verify subject exists
    if (subject) {
      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }
    }

    // Verify department exists
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Create exam
    const exam = await CIAExam.create({
      title,
      examType,
      course,
      subject,
      department,
      scheduledDate,
      duration,
      totalMarks,
      passingMarks,
      instructions: instructions ? (Array.isArray(instructions) ? instructions : [instructions]) : [],
      chaptersIncluded: chaptersIncluded ? (Array.isArray(chaptersIncluded) ? chaptersIncluded : [chaptersIncluded]) : [],
      createdBy: req.user.id
    });

    // Populate references
    await exam.populate([
      { path: 'course', select: 'name code' },
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name code' },
      { path: 'chaptersIncluded', select: 'title chapterNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating exam',
      error: error.message
    });
  }
};

/**
 * @desc    Get all exams
 * @route   GET /api/exams
 * @access  Private
 */
exports.getExams = async (req, res, next) => {
  try {
    const { course, subject, department, examType, status, year, semester } = req.query;

    const filter = {};
    if (course) filter.course = course;
    if (subject) filter.subject = subject;
    if (department) filter.department = department;
    if (examType) filter.examType = examType;
    if (status) filter.status = status;
    if (year) filter.academicYear = year;
    if (semester) filter.semester = semester;

    // Faculty can only see their own courses' exams
    if (req.user.role === 'Faculty') {
      const facultyCourses = await Course.find({ faculty: req.user.id }).select('_id');
      const courseIds = facultyCourses.map(c => c._id);
      filter.course = { $in: courseIds };
    }

    const exams = await CIAExam.find(filter)
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate('chaptersIncluded', 'title chapterNumber')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
};

/**
 * @desc    Get single exam by ID
 * @route   GET /api/exams/:id
 * @access  Private
 */
exports.getExamById = async (req, res, next) => {
  try {
    const exam = await CIAExam.findById(req.params.id)
      .populate('course', 'name code faculty')
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .populate('chaptersIncluded', 'title chapterNumber')
      .populate('createdBy', 'name email')
      .populate('questions')
      .populate({
        path: 'marksEntries',
        populate: {
          path: 'student',
          select: 'name rollNumber email'
        }
      });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Get exam by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam',
      error: error.message
    });
  }
};

/**
 * @desc    Update exam
 * @route   PUT /api/exams/:id
 * @access  Private/Faculty
 */
exports.updateExam = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let exam = await CIAExam.findById(req.params.id).populate('course');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam'
      });
    }

    // Cannot update exam if it's completed or ongoing
    if (exam.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed exam'
      });
    }

    // Update exam
    req.body.updatedBy = req.user.id;
    exam = await CIAExam.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'course', select: 'name code' },
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name code' },
      { path: 'chaptersIncluded', select: 'title chapterNumber' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: exam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exam',
      error: error.message
    });
  }
};

/**
 * @desc    Delete exam
 * @route   DELETE /api/exams/:id
 * @access  Private/Faculty/Admin
 */
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await CIAExam.findById(req.params.id).populate('course');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exam'
      });
    }

    // Cannot delete exam if marks have been entered
    const ExamMarks = require('../models/ExamMarks');
    const marksCount = await ExamMarks.countDocuments({ exam: exam._id });

    if (marksCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete exam with existing marks entries'
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exam',
      error: error.message
    });
  }
};

/**
 * @desc    Update exam status
 * @route   PATCH /api/exams/:id/status
 * @access  Private/Faculty
 */
exports.updateExamStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Draft', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const exam = await CIAExam.findById(req.params.id).populate('course');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam'
      });
    }

    exam.status = status;
    exam.updatedBy = req.user.id;
    await exam.save();

    res.status(200).json({
      success: true,
      message: `Exam status updated to ${status}`,
      data: exam
    });
  } catch (error) {
    console.error('Update exam status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exam status',
      error: error.message
    });
  }
};

/**
 * @desc    Get exams by course
 * @route   GET /api/exams/course/:courseId
 * @access  Private
 */
exports.getExamsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const exams = await CIAExam.find({ course: courseId })
      .populate('subject', 'name code')
      .populate('chaptersIncluded', 'title chapterNumber')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    console.error('Get exams by course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
};

/**
 * @desc    Get exam statistics
 * @route   GET /api/exams/:id/statistics
 * @access  Private/Faculty
 */
exports.getExamStatistics = async (req, res, next) => {
  try {
    const exam = await CIAExam.findById(req.params.id).populate('course');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view exam statistics'
      });
    }

    const ExamMarks = require('../models/ExamMarks');
    const ExamQuestion = require('../models/ExamQuestion');

    // Get question count
    const questionCount = await ExamQuestion.countDocuments({ exam: exam._id });

    // Get marks entries count
    const marksEntriesCount = await ExamMarks.countDocuments({ exam: exam._id });

    // Get students who appeared
    const studentsAppeared = await ExamMarks.distinct('student', { exam: exam._id });

    // Get average marks
    const marksAggregation = await ExamMarks.aggregate([
      { $match: { exam: exam._id } },
      {
        $group: {
          _id: null,
          avgMarks: { $avg: '$totalMarks' },
          maxMarks: { $max: '$totalMarks' },
          minMarks: { $min: '$totalMarks' },
          passCount: {
            $sum: {
              $cond: [{ $gte: ['$totalMarks', exam.passingMarks] }, 1, 0]
            }
          },
          failCount: {
            $sum: {
              $cond: [{ $lt: ['$totalMarks', exam.passingMarks] }, 1, 0]
            }
          }
        }
      }
    ]);

    const statistics = {
      exam: {
        title: exam.title,
        type: exam.examType,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status: exam.status
      },
      questions: {
        total: questionCount
      },
      students: {
        appeared: studentsAppeared.length,
        marksEntered: marksEntriesCount
      },
      performance: marksAggregation.length > 0 ? {
        average: Math.round(marksAggregation[0].avgMarks * 100) / 100,
        highest: marksAggregation[0].maxMarks,
        lowest: marksAggregation[0].minMarks,
        passed: marksAggregation[0].passCount,
        failed: marksAggregation[0].failCount,
        passPercentage: studentsAppeared.length > 0
          ? Math.round((marksAggregation[0].passCount / studentsAppeared.length) * 100 * 100) / 100
          : 0
      } : null
    };

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get exam statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get upcoming exams
 * @route   GET /api/exams/upcoming
 * @access  Private
 */
exports.getUpcomingExams = async (req, res, next) => {
  try {
    const { department, course } = req.query;

    const filter = {
      scheduledDate: { $gte: new Date() },
      status: { $in: ['Draft', 'Scheduled'] }
    };

    if (department) filter.department = department;
    if (course) filter.course = course;

    // Faculty can only see their own courses' exams
    if (req.user.role === 'Faculty') {
      const facultyCourses = await Course.find({ faculty: req.user.id }).select('_id');
      const courseIds = facultyCourses.map(c => c._id);
      filter.course = { $in: courseIds };
    }

    const exams = await CIAExam.find(filter)
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('department', 'name code')
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    console.error('Get upcoming exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming exams',
      error: error.message
    });
  }
};
