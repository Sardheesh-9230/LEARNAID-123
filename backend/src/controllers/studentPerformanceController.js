const StudentPerformance = require('../models/StudentPerformance');
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const { validationResult } = require('express-validator');

/**
 * @desc    Get student performance by student ID
 * @route   GET /api/performance/student/:studentId
 * @access  Private
 */
exports.getPerformanceByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { course, subject } = req.query;

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const filter = { student: studentId };
    if (course) filter.course = course;
    if (subject) filter.subject = subject;

    const performance = await StudentPerformance.find(filter)
      .populate('student', 'name rollNumber email')
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('chapterPerformance.chapter', 'title chapterNumber')
      .populate('weakChapters', 'title chapterNumber')
      .populate('strongChapters', 'title chapterNumber')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: performance.length,
      data: performance
    });
  } catch (error) {
    console.error('Get performance by student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student performance',
      error: error.message
    });
  }
};

/**
 * @desc    Get student performance by course
 * @route   GET /api/performance/course/:courseId
 * @access  Private/Faculty
 */
exports.getPerformanceByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this course'
      });
    }

    const performance = await StudentPerformance.find({ course: courseId })
      .populate('student', 'name rollNumber email department')
      .populate('subject', 'name code')
      .populate('chapterPerformance.chapter', 'title chapterNumber')
      .sort({ overallPerformance: -1 });

    res.status(200).json({
      success: true,
      count: performance.length,
      data: performance
    });
  } catch (error) {
    console.error('Get performance by course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course performance',
      error: error.message
    });
  }
};

/**
 * @desc    Get weak students in a course
 * @route   GET /api/performance/course/:courseId/weak-students
 * @access  Private/Faculty
 */
exports.getWeakStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { threshold } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this course'
      });
    }

    const performanceThreshold = threshold ? parseFloat(threshold) : 50;

    const weakStudents = await StudentPerformance.find({
      course: courseId,
      overallPerformance: { $lt: performanceThreshold }
    })
      .populate('student', 'name rollNumber email department')
      .populate('subject', 'name code')
      .populate('weakChapters', 'title chapterNumber')
      .sort({ overallPerformance: 1 });

    res.status(200).json({
      success: true,
      count: weakStudents.length,
      threshold: performanceThreshold,
      data: weakStudents
    });
  } catch (error) {
    console.error('Get weak students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weak students',
      error: error.message
    });
  }
};

/**
 * @desc    Get chapter-wise weak students
 * @route   GET /api/performance/course/:courseId/chapter/:chapterId/weak-students
 * @access  Private/Faculty
 */
exports.getWeakStudentsByChapter = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const { threshold } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this course'
      });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const performanceThreshold = threshold ? parseFloat(threshold) : 50;

    const weakStudents = await StudentPerformance.find({
      course: courseId,
      'chapterPerformance.chapter': chapterId,
      'chapterPerformance.percentage': { $lt: performanceThreshold }
    })
      .populate('student', 'name rollNumber email department')
      .populate('subject', 'name code')
      .populate('chapterPerformance.chapter', 'title chapterNumber')
      .sort({ 'chapterPerformance.percentage': 1 });

    res.status(200).json({
      success: true,
      count: weakStudents.length,
      chapter: chapter.title,
      threshold: performanceThreshold,
      data: weakStudents
    });
  } catch (error) {
    console.error('Get weak students by chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weak students by chapter',
      error: error.message
    });
  }
};

/**
 * @desc    Get top performers in a course
 * @route   GET /api/performance/course/:courseId/top-performers
 * @access  Private/Faculty
 */
exports.getTopPerformers = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { limit } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this course'
      });
    }

    const topPerformers = await StudentPerformance.find({ course: courseId })
      .populate('student', 'name rollNumber email department')
      .populate('subject', 'name code')
      .populate('strongChapters', 'title chapterNumber')
      .sort({ overallPerformance: -1 })
      .limit(limit ? parseInt(limit) : 10);

    res.status(200).json({
      success: true,
      count: topPerformers.length,
      data: topPerformers
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top performers',
      error: error.message
    });
  }
};

/**
 * @desc    Get performance statistics for a course
 * @route   GET /api/performance/course/:courseId/statistics
 * @access  Private/Faculty
 */
exports.getCourseStatistics = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view statistics for this course'
      });
    }

    const statistics = await StudentPerformance.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          avgPerformance: { $avg: '$overallPerformance' },
          maxPerformance: { $max: '$overallPerformance' },
          minPerformance: { $min: '$overallPerformance' },
          excellentCount: {
            $sum: { $cond: [{ $gte: ['$overallPerformance', 75] }, 1, 0] }
          },
          goodCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$overallPerformance', 50] },
                    { $lt: ['$overallPerformance', 75] }
                  ]
                },
                1,
                0
              ]
            }
          },
          weakCount: {
            $sum: { $cond: [{ $lt: ['$overallPerformance', 50] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = statistics.length > 0 ? statistics[0] : {
      totalStudents: 0,
      avgPerformance: 0,
      maxPerformance: 0,
      minPerformance: 0,
      excellentCount: 0,
      goodCount: 0,
      weakCount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        course: {
          id: course._id,
          name: course.name,
          code: course.code
        },
        statistics: {
          totalStudents: stats.totalStudents,
          averagePerformance: Math.round(stats.avgPerformance * 100) / 100,
          highestPerformance: stats.maxPerformance,
          lowestPerformance: stats.minPerformance,
          distribution: {
            excellent: { count: stats.excellentCount, label: '75% and above' },
            good: { count: stats.goodCount, label: '50-74%' },
            weak: { count: stats.weakCount, label: 'Below 50%' }
          }
        }
      }
    });
  } catch (error) {
    console.error('Get course statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Update chapter performance manually
 * @route   PUT /api/performance/:id/chapter
 * @access  Private/Faculty
 */
exports.updateChapterPerformance = async (req, res, next) => {
  try {
    const { chapter, marksObtained, totalMarks } = req.body;

    let performance = await StudentPerformance.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'faculty'
      });

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && performance.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update performance for this course'
      });
    }

    // Verify chapter exists
    const chapterExists = await Chapter.findById(chapter);
    if (!chapterExists) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Update chapter performance
    await performance.updateChapterPerformance(chapter, marksObtained, totalMarks);

    await performance.populate([
      { path: 'student', select: 'name rollNumber email' },
      { path: 'course', select: 'name code' },
      { path: 'subject', select: 'name code' },
      { path: 'chapterPerformance.chapter', select: 'title chapterNumber' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Chapter performance updated successfully',
      data: performance
    });
  } catch (error) {
    console.error('Update chapter performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chapter performance',
      error: error.message
    });
  }
};

/**
 * @desc    Recalculate performance metrics
 * @route   POST /api/performance/:id/recalculate
 * @access  Private/Faculty
 */
exports.recalculatePerformance = async (req, res, next) => {
  try {
    let performance = await StudentPerformance.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'faculty'
      });

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance record not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && performance.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to recalculate performance for this course'
      });
    }

    await performance.recalculateOverallMetrics();

    await performance.populate([
      { path: 'student', select: 'name rollNumber email' },
      { path: 'course', select: 'name code' },
      { path: 'subject', select: 'name code' },
      { path: 'chapterPerformance.chapter', select: 'title chapterNumber' },
      { path: 'weakChapters', select: 'title chapterNumber' },
      { path: 'strongChapters', select: 'title chapterNumber' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Performance metrics recalculated successfully',
      data: performance
    });
  } catch (error) {
    console.error('Recalculate performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recalculating performance',
      error: error.message
    });
  }
};

module.exports = exports;
