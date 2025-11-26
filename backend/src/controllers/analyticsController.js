const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const ExamMarks = require('../models/ExamMarks');
const CIAExam = require('../models/CIAExam');
const ExamQuestion = require('../models/ExamQuestion');
const Chapter = require('../models/Chapter');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
const getDashboardAnalytics = async (req, res) => {
  try {
    // Overview statistics
    const totalUsers = await User.countDocuments();
    const totalDepartments = await Department.countDocuments({ isActive: true });
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const totalActiveUsers = await User.countDocuments({ status: 'Active' });

    // User statistics by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Active'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Department statistics
    const departmentStats = await Department.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: 'department',
          as: 'subjects'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          totalUsers: { $size: '$users' },
          totalSubjects: { $size: '$subjects' },
          students: {
            $size: {
              $filter: {
                input: '$users',
                cond: { $eq: ['$$this.role', 'Student'] }
              }
            }
          },
          faculty: {
            $size: {
              $filter: {
                input: '$users',
                cond: { $eq: ['$$this.role', 'Faculty'] }
              }
            }
          }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    // Recent activities (last 10)
    const recentActivities = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action resourceType details createdAt user');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDepartments,
          totalSubjects,
          totalActiveUsers
        },
        userStats: usersByRole.reduce((acc, curr) => {
          acc[curr._id] = {
            total: curr.count,
            active: curr.active
          };
          return acc;
        }, {}),
        departmentStats,
        recentActivities
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard analytics'
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private (Admin)
const getUserAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // User registrations over time
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          roles: {
            $push: '$role'
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // User activity (logins) over time
    const userActivity = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$lastLogin' },
            month: { $month: '$lastLogin' },
            day: { $dayOfMonth: '$lastLogin' }
          },
          uniqueLogins: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Users by department
    const usersByDepartment = await User.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      {
        $unwind: '$dept'
      },
      {
        $group: {
          _id: {
            department: '$dept.name',
            role: '$role'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        userRegistrations,
        userActivity,
        usersByDepartment
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics'
    });
  }
};

// @desc    Get department analytics
// @route   GET /api/analytics/departments/:id
// @access  Private
const getDepartmentAnalytics = async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Students by semester
    const studentsBySemester = await User.aggregate([
      {
        $match: {
          department: department._id,
          role: 'Student',
          status: 'Active'
        }
      },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
          sections: { $addToSet: '$section' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Students by section
    const studentsBySection = await User.aggregate([
      {
        $match: {
          department: department._id,
          role: 'Student',
          status: 'Active'
        }
      },
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 },
          semesters: { $addToSet: '$semester' }
        }
      }
    ]);

    // Subject distribution
    const subjectDistribution = await Subject.aggregate([
      {
        $match: {
          department: department._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$semester',
          subjects: {
            $push: {
              name: '$name',
              code: '$code',
              credits: '$credits'
            }
          },
          totalCredits: { $sum: '$credits' },
          subjectCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Faculty statistics
    const facultyStats = await User.aggregate([
      {
        $match: {
          department: department._id,
          role: 'Faculty',
          status: 'Active'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'assignedSubjects',
          foreignField: '_id',
          as: 'subjects'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          designation: 1,
          experience: 1,
          subjectCount: { $size: '$subjects' },
          totalCredits: { $sum: '$subjects.credits' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        department: {
          name: department.name,
          code: department.code
        },
        studentsBySemester,
        studentsBySection,
        subjectDistribution,
        facultyStats
      }
    });

  } catch (error) {
    console.error('Department analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department analytics'
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/analytics/activities
// @access  Private (Admin)
const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      resourceType,
      user,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = {};
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (user) filter.user = user;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get activity logs
    const activities = await ActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    // Get total count
    const total = await ActivityLog.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: pageNum,
        pages,
        total
      }
    });

  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity logs'
    });
  }
};

/**
 * @desc    Get comprehensive performance analytics
 * @route   GET /api/analytics/performance/comprehensive
 * @access  Private/Faculty/Admin
 */
const getComprehensivePerformanceAnalytics = async (req, res, next) => {
  try {
    const { examId, subjectId, courseId } = req.query;

    // Build match criteria
    let matchCriteria = {};
    if (examId) matchCriteria.exam = mongoose.Types.ObjectId(examId);
    if (subjectId) matchCriteria.subject = mongoose.Types.ObjectId(subjectId);
    if (courseId) matchCriteria.course = mongoose.Types.ObjectId(courseId);

    // Get total marks and performance for each student
    const studentPerformances = await ExamMarks.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$student',
          totalMarksObtained: { $sum: '$marksObtained' },
          totalPossibleMarks: { $sum: '$totalMarks' },
          examCount: { $sum: 1 },
          subjectMarks: {
            $push: {
              subject: '$subject',
              exam: '$exam',
              marksObtained: '$marksObtained',
              totalMarks: '$totalMarks',
              chapter: '$chapter'
            }
          }
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
          rollNumber: '$studentInfo.rollNumber',
          totalMarks: '$totalMarksObtained',
          totalPossible: '$totalPossibleMarks',
          percentage: {
            $multiply: [
              { $divide: ['$totalMarksObtained', '$totalPossibleMarks'] },
              100
            ]
          },
          examCount: '$examCount',
          subjectMarks: '$subjectMarks'
        }
      },
      {
        $addFields: {
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
                              else: {
                                $cond: {
                                  if: { $gte: ['$percentage', 40] },
                                  then: 'C',
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
          }
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    // Get chapter-wise performance for each student to identify strong/weak areas
    const studentsWithChapterAnalysis = await Promise.all(
      studentPerformances.map(async (student) => {
        // Get chapter-wise performance
        const chapterPerformance = await ExamMarks.aggregate([
          { 
            $match: { 
              student: student.studentId,
              ...matchCriteria
            }
          },
          {
            $group: {
              _id: '$chapter',
              totalMarksObtained: { $sum: '$marksObtained' },
              totalPossibleMarks: { $sum: '$totalMarks' },
              questionCount: { $sum: 1 }
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
              chapterTitle: '$chapterInfo.title',
              chapterNumber: '$chapterInfo.chapterNumber',
              percentage: {
                $multiply: [
                  { $divide: ['$totalMarksObtained', '$totalPossibleMarks'] },
                  100
                ]
              }
            }
          },
          { $sort: { chapterNumber: 1 } }
        ]);

        // Identify strong (>=75%) and weak (<50%) chapters
        const strongChapters = chapterPerformance
          .filter(ch => ch.percentage >= 75)
          .map(ch => ch.chapterTitle);
        
        const weakChapters = chapterPerformance
          .filter(ch => ch.percentage < 50)
          .map(ch => ch.chapterTitle);

        // Calculate CO-wise performance (assuming chapters map to COs)
        const coPerformance = {};
        chapterPerformance.forEach((ch, index) => {
          const coNumber = (index % 5) + 1; // Simple mapping - can be enhanced
          if (!coPerformance[coNumber]) {
            coPerformance[coNumber] = [];
          }
          coPerformance[coNumber].push(ch.percentage);
        });

        // Average CO performance
        Object.keys(coPerformance).forEach(co => {
          const scores = coPerformance[co];
          coPerformance[co] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        });

        return {
          ...student,
          strongChapters,
          weakChapters,
          coPerformance
        };
      })
    );

    // Calculate Course Outcome (CO) analysis
    const coAnalysis = [];
    const coMapping = {
      1: "Apply knowledge of mathematics, science, and engineering fundamentals",
      2: "Identify, formulate, and solve complex engineering problems",
      3: "Design solutions for complex engineering problems",
      4: "Conduct investigations using research-based knowledge",
      5: "Create solutions that meet societal and environmental needs"
    };

    for (let coNumber = 1; coNumber <= 5; coNumber++) {
      const coPerformances = studentsWithChapterAnalysis
        .map(s => s.coPerformance[coNumber] || 0)
        .filter(score => score > 0);

      if (coPerformances.length > 0) {
        const averageAttainment = coPerformances.reduce((sum, score) => sum + score, 0) / coPerformances.length;
        const studentsAbove60 = coPerformances.filter(score => score >= 60).length;
        const studentsBelow40 = coPerformances.filter(score => score < 40).length;
        
        let attainmentLevel = 'Poor';
        if (averageAttainment >= 80) attainmentLevel = 'Excellent';
        else if (averageAttainment >= 65) attainmentLevel = 'Good';
        else if (averageAttainment >= 50) attainmentLevel = 'Average';

        coAnalysis.push({
          coNumber: coNumber.toString(),
          coDescription: coMapping[coNumber],
          averageAttainment,
          studentsAbove60,
          studentsBelow40,
          totalStudents: coPerformances.length,
          attainmentLevel
        });
      }
    }

    // Overall statistics
    const totalStudents = studentsWithChapterAnalysis.length;
    const passCount = studentsWithChapterAnalysis.filter(s => s.percentage >= 40).length;
    const failCount = totalStudents - passCount;
    const averageMarks = studentsWithChapterAnalysis.reduce((sum, s) => sum + s.totalMarks, 0) / totalStudents || 0;
    const averagePercentage = studentsWithChapterAnalysis.reduce((sum, s) => sum + s.percentage, 0) / totalStudents || 0;

    res.status(200).json({
      success: true,
      data: {
        studentPerformances: studentsWithChapterAnalysis,
        coAnalysis,
        statistics: {
          totalStudents,
          passCount,
          failCount,
          passPercentage: (passCount / totalStudents * 100).toFixed(2),
          averageMarks: Math.round(averageMarks * 100) / 100,
          averagePercentage: Math.round(averagePercentage * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Comprehensive analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating comprehensive analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Get exam-wise total marks summary
 * @route   GET /api/analytics/exam/:examId/total-marks
 * @access  Private/Faculty/Admin
 */
const getExamTotalMarksSummary = async (req, res, next) => {
  try {
    const { examId } = req.params;

    // Get exam details
    const exam = await CIAExam.findById(examId)
      .populate('course', 'name code')
      .populate('subject', 'name code');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get total marks for each student
    const studentTotalMarks = await ExamMarks.aggregate([
      { $match: { exam: mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: '$student',
          totalMarksObtained: { $sum: '$marksObtained' },
          totalPossibleMarks: { $sum: '$totalMarks' },
          questionCount: { $sum: 1 },
          questionMarks: {
            $push: {
              question: '$question',
              chapter: '$chapter',
              marksObtained: '$marksObtained',
              totalMarks: '$totalMarks'
            }
          }
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
          rollNumber: '$studentInfo.rollNumber',
          email: '$studentInfo.email',
          totalMarksObtained: 1,
          totalPossibleMarks: 1,
          percentage: {
            $multiply: [
              { $divide: ['$totalMarksObtained', '$totalPossibleMarks'] },
              100
            ]
          },
          grade: {
            $cond: {
              if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 90] },
              then: 'O',
              else: {
                $cond: {
                  if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 80] },
                  then: 'A+',
                  else: {
                    $cond: {
                      if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 70] },
                      then: 'A',
                      else: {
                        $cond: {
                          if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 60] },
                          then: 'B+',
                          else: {
                            $cond: {
                              if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 50] },
                              then: 'B',
                              else: {
                                $cond: {
                                  if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, 40] },
                                  then: 'C',
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
          status: {
            $cond: {
              if: { $gte: [{ $multiply: [{ $divide: ['$totalMarksObtained', '$totalPossibleMarks'] }, 100] }, exam.passingMarks / exam.totalMarks * 100] },
              then: 'Pass',
              else: 'Fail'
            }
          },
          questionMarks: 1
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    // Calculate summary statistics
    const totalStudents = studentTotalMarks.length;
    const passedStudents = studentTotalMarks.filter(s => s.status === 'Pass').length;
    const failedStudents = totalStudents - passedStudents;
    
    const averageMarks = totalStudents > 0 
      ? studentTotalMarks.reduce((sum, s) => sum + s.totalMarksObtained, 0) / totalStudents 
      : 0;
    
    const averagePercentage = totalStudents > 0 
      ? studentTotalMarks.reduce((sum, s) => sum + s.percentage, 0) / totalStudents 
      : 0;

    const highestMarks = totalStudents > 0 
      ? Math.max(...studentTotalMarks.map(s => s.totalMarksObtained)) 
      : 0;
    
    const lowestMarks = totalStudents > 0 
      ? Math.min(...studentTotalMarks.map(s => s.totalMarksObtained)) 
      : 0;

    // Grade distribution
    const gradeDistribution = {
      O: studentTotalMarks.filter(s => s.grade === 'O').length,
      'A+': studentTotalMarks.filter(s => s.grade === 'A+').length,
      A: studentTotalMarks.filter(s => s.grade === 'A').length,
      'B+': studentTotalMarks.filter(s => s.grade === 'B+').length,
      B: studentTotalMarks.filter(s => s.grade === 'B').length,
      C: studentTotalMarks.filter(s => s.grade === 'C').length,
      F: studentTotalMarks.filter(s => s.grade === 'F').length
    };

    res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam._id,
          title: exam.title,
          type: exam.examType,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          course: exam.course,
          subject: exam.subject
        },
        studentResults: studentTotalMarks,
        summary: {
          totalStudents,
          passedStudents,
          failedStudents,
          passPercentage: (passedStudents / totalStudents * 100).toFixed(2),
          averageMarks: Math.round(averageMarks * 100) / 100,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          highestMarks,
          lowestMarks,
          gradeDistribution
        }
      }
    });

  } catch (error) {
    console.error('Exam total marks summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating exam total marks summary',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getUserAnalytics,
  getDepartmentAnalytics,
  getActivityLogs,
  getComprehensivePerformanceAnalytics,
  getExamTotalMarksSummary
};