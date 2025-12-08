const express = require('express');
const mongoose = require('mongoose');
const StudentMarkEntry = require('../models/StudentMarkEntry');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');

const router = express.Router();

// Public analytics endpoint for dashboard (no authentication required)
router.get('/public-statistics', async (req, res) => {
  try {
    console.log('📊 Fetching public analytics data...');

    // Get performance by exam type - use existing percentage field
    const performanceByExamType = await StudentMarkEntry.aggregate([
      {
        $match: {
          percentage: { $exists: true, $ne: null, $gte: 0 }
        }
      },
      {
        $group: {
          _id: '$examType',
          averagePercentage: { $avg: '$percentage' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          examType: '$_id',
          averagePercentage: { $round: ['$averagePercentage', 2] },
          count: 1,
          _id: 0
        }
      }
    ]);

    console.log('Performance by exam type:', performanceByExamType);

    // Get user distribution by role
    const userDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    console.log('User distribution:', userDistribution);

    // Get department statistics
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
        $project: {
          name: 1,
          code: 1,
          studentCount: {
            $size: {
              $filter: {
                input: '$users',
                as: 'user',
                cond: { $eq: ['$$user.role', 'Student'] }
              }
            }
          },
          facultyCount: {
            $size: {
              $filter: {
                input: '$users',
                as: 'user',
                cond: { $eq: ['$$user.role', 'Faculty'] }
              }
            }
          }
        }
      }
    ]);

    console.log('Department stats:', departmentStats);

    // Get total counts
    const totalStats = {
      totalStudents: await User.countDocuments({ role: 'Student' }),
      totalFaculty: await User.countDocuments({ role: 'Faculty' }),
      totalSubjects: await Subject.countDocuments(),
      totalMarkEntries: await StudentMarkEntry.countDocuments()
    };

    console.log('Total stats:', totalStats);

    res.json({
      success: true,
      data: {
        performanceByExamType,
        userDistribution,
        departmentStats,
        totalStats
      }
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
});

// Faculty-specific analytics endpoint
router.get('/faculty-statistics/:facultyId', async (req, res) => {
  try {
    console.log('📊 Fetching faculty-specific analytics data for:', req.params.facultyId);
    
    const facultyId = req.params.facultyId;
    
    // Get faculty's subjects (faculty is an array of objects with user field)
    const facultySubjects = await Subject.find({ 'faculty.user': facultyId });
    const subjectIds = facultySubjects.map(s => s._id);
    
    console.log('Faculty subjects:', subjectIds);
    
    // Get performance by exam type for faculty's subjects only
    const performanceByExamType = await StudentMarkEntry.aggregate([
      {
        $match: {
          subject: { $in: subjectIds },
          percentage: { $exists: true, $ne: null, $gte: 0 }
        }
      },
      {
        $group: {
          _id: '$examType',
          averagePercentage: { $avg: '$percentage' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          examType: '$_id',
          averagePercentage: { $round: ['$averagePercentage', 2] },
          count: 1,
          _id: 0
        }
      }
    ]);

    console.log('Faculty performance by exam type:', performanceByExamType);

    // Get students enrolled in faculty's subjects
    const studentsInFacultySubjects = await StudentMarkEntry.aggregate([
      {
        $match: {
          subject: { $in: subjectIds }
        }
      },
      {
        $group: {
          _id: '$student'
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
      {
        $unwind: '$studentInfo'
      },
      {
        $match: {
          'studentInfo.role': 'Student'
        }
      }
    ]);

    // Get faculty's department stats
    const faculty = await User.findById(facultyId);
    const departmentStats = faculty ? [{
      name: faculty.department?.name || 'Faculty Department',
      studentCount: studentsInFacultySubjects.length,
      facultyCount: 1,
      subjectCount: facultySubjects.length
    }] : [];

    // Calculate total stats for faculty
    const totalStats = {
      totalStudents: studentsInFacultySubjects.length,
      totalFaculty: 1,
      totalSubjects: facultySubjects.length,
      totalMarkEntries: await StudentMarkEntry.countDocuments({ subject: { $in: subjectIds } })
    };

    res.json({
      success: true,
      data: {
        performanceByExamType,
        userDistribution: [
          { role: 'Student', count: studentsInFacultySubjects.length },
          { role: 'Faculty', count: 1 }
        ],
        departmentStats,
        totalStats,
        facultySubjects: facultySubjects.map(s => ({
          name: s.name,
          code: s.code,
          _id: s._id
        }))
      }
    });

  } catch (error) {
    console.error('❌ Faculty Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty analytics data',
      error: error.message
    });
  }
});

module.exports = router;