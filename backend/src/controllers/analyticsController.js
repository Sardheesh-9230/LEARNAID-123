const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');

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

module.exports = {
  getDashboardAnalytics,
  getUserAnalytics,
  getDepartmentAnalytics,
  getActivityLogs
};